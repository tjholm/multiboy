import { HostMessage } from "./messages";

const PEER_CONFIG = {
    'iceServers': [
        { 'urls': 'stun:stun.stunprotocol.org:3478' },
        { 'urls': 'stun:stun.l.google.com:19302' },
    ]
};

// A connected Peer
class Hub {
    private audioDestination: MediaStreamAudioDestinationNode;
    private video: MediaStream;
    private socket: WebSocket;
    private connections: Record<string, RTCPeerConnection> = {};
    private sendChannels: Record<string, RTCDataChannel> = {};
    private messageCallback: (connectionId: string, e: MessageEvent) => void;
    private connectedCallback: (connectionId: string) => void;

    constructor(socket: WebSocket, video: MediaStream, audioDestination: MediaStreamAudioDestinationNode) {
        this.socket = socket;
        this.audioDestination = audioDestination;
        this.video = video;
    }

    private gotIceCandidate = (connectionId: string) => (e: RTCPeerConnectionIceEvent) => {
        if (e.candidate != null) {
            this.socket.send(JSON.stringify({
                connectionId,
                'ice': e.candidate
            }));
        }
    }

    get guests() {
        return Object.keys(this.connections)
            .filter(k => this.connections[k].connectionState === 'connected')
            .sort();
    }

    get players() {
        return ['host', ...this.guests];
    }

    onMessage = (func: (connectionId: string, e: MessageEvent) => void) => {
        this.messageCallback = func;
    }

    onConnection = (func: (connectionId: string) => void) => {
        this.connectedCallback = func;
    }

    private gotConnection = (connectionId: string) => () => {
        this.connectedCallback(connectionId);
    }

    private gotMessage = (connectionId: string) => (e: MessageEvent) => {
        this.messageCallback && this.messageCallback(connectionId, e);
    }

    send = (connectionId: string, message: HostMessage) => {
        const connection = this.sendChannels[connectionId];
        if (connection && connection.readyState == 'open') {
            connection.send(JSON.stringify(message));
        } else {
            console.log(`${connectionId} not connected`);
        }
    }

    private gotDataChannel = (connectionId: string) => (e: RTCDataChannelEvent) => {
        e.channel.onmessage = this.gotMessage(connectionId);
    }

    private pruneConnections = () => {
        Object.entries(this.connections).forEach(([k, v]) => {
            if (v.connectionState === 'disconnected') {
                delete this.connections[k];
                delete this.sendChannels[k];
            }
        });
    }

    private onSignal = async (e) => {
        const signal = JSON.parse(e.data);

        if (!signal.connectionId) {
            // invalid message ignore
            console.log('received invalid message');

            return
        }

        // Create a new connection for this connectionID if one does not exist
        let connection = this.connections[signal.connectionId]
        if (!connection) {
            this.connections[signal.connectionId] = new RTCPeerConnection(PEER_CONFIG);
            connection = this.connections[signal.connectionId];
            connection.onicecandidate = this.gotIceCandidate(signal.connectionId);
            connection.ondatachannel = this.gotDataChannel(signal.connectionId);

            // create a data channel for notifying users of game state changes (e.g. game modes like host seat/mixed)
            this.sendChannels[signal.connectionId] = connection.createDataChannel('input');

            this.sendChannels[signal.connectionId].onopen = this.gotConnection(signal.connectionId);

            this.audioDestination.stream.getTracks().forEach((t) => {
                connection.addTrack(t, this.audioDestination.stream);
            });

            this.video.getTracks().forEach((t) => {
                connection.addTrack(t, this.video);
            });
        }

        // handle signal messages from the server
        // this is where we'll handle handshakes
        if (signal.sdp) {
            await connection.setRemoteDescription(new RTCSessionDescription(signal.sdp));

            // only process offers
            if (signal.sdp.type !== 'offer') return;

            const answer = await connection.createAnswer();

            await connection.setLocalDescription(answer);

            await this.socket.send(JSON.stringify({
                'connectionId': signal.connectionId,
                'sdp': connection.localDescription
            }));
        } else if (signal.ice) {
            connection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) => console.error(e));
        }
    }

    start = () => {
        this.socket.addEventListener('message', this.onSignal);

        setInterval(this.pruneConnections, 5000);
    }
}

export default Hub;