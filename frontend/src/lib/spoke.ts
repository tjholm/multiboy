import { HostMessage } from "./messages";

const PEER_CONFIG = {
    'iceServers': [
        { 'urls': 'stun:stun.stunprotocol.org:3478' },
        { 'urls': 'stun:stun.l.google.com:19302' },
    ]
};

type OnMediaCallback = (stream: MediaStream) => void;

class Spoke {
    private socket: WebSocket;
    private peerConnection: RTCPeerConnection;
    private sendDataChannel: RTCDataChannel;
    private receiveDataChannel: RTCDataChannel;
    private disconnectionTimerId: any;
    private onMessageCallback: (e: HostMessage) => void;
    private onMedia: OnMediaCallback;
    private id: string;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    private offer = async () => {
        // begin connection
        const cd = await this.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        });
        await this.peerConnection.setLocalDescription(cd);
        await this.socket.send(JSON.stringify({
            'sdp': this.peerConnection.localDescription
        }));
    }

    send = (data: Record<string, any>) => {
        // broadcast on send channels
        this.sendDataChannel.send(JSON.stringify({
            connectionId: this.id,
            ...data,
        }));
    }

    private gotMessage = (e: MessageEvent) => {
        const msg = JSON.parse(e.data) as HostMessage;

        this.onMessageCallback && this.onMessageCallback(msg);
    }

    onMessage = (func: (e: HostMessage) => void) => {
        this.onMessageCallback = func;
    }

    private onDataChannel = (e: RTCDataChannelEvent) => {
        this.receiveDataChannel = e.channel;
        this.receiveDataChannel.onmessage = this.gotMessage;
    }

    private gotIceCandidate = (e: RTCPeerConnectionIceEvent) => {
        if (e.candidate != null) {
            this.socket.send(JSON.stringify({
                'ice': e.candidate
            }));
        }
    }

    public onMediaSource(callback: OnMediaCallback) {
        this.onMedia = callback;
    }

    private onTrack = (e: RTCTrackEvent) => {
        this.onMedia(e.streams[0]);
    }

    private connectionStateChange = (e) => {
        if (this.peerConnection.connectionState === 'connected') {
            this.socket.close();
        }
    }

    private onSignal = async (e) => {
        const signal = JSON.parse(e.data);

        if (signal.sdp) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.ice) {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) => console.error(e));
        }
    }

    private checkDisconnected = () => {
        if (this.peerConnection.connectionState === 'disconnected' || this.peerConnection.connectionState === 'failed') {
            this.onMedia && this.onMedia(null);

            // notify user that connection has failed
            clearInterval(this.disconnectionTimerId);
            alert('connection to the host was lost or has failed, try refreshing to page to reconnect');
        }
    }

    start = async () => {
        this.socket.addEventListener('message', this.onSignal);
        this.peerConnection = new RTCPeerConnection(PEER_CONFIG);
        this.peerConnection.ontrack = this.onTrack;
        this.sendDataChannel = this.peerConnection.createDataChannel('send');
        this.peerConnection.onicecandidate = this.gotIceCandidate;
        this.peerConnection.onconnectionstatechange = this.connectionStateChange;
        this.peerConnection.ondatachannel = this.onDataChannel;

        // poll peer connection status
        this.disconnectionTimerId = setInterval(this.checkDisconnected, 2000);
       
        await this.offer();
    }
}

export default Spoke;