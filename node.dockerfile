# syntax=docker/dockerfile:1
FROM node:22.4.1-alpine as build

ARG HANDLER

# Python and make are required by certain native package build processes in NPM packages.
RUN --mount=type=cache,sharing=locked,target=/etc/apk/cache \
    apk --update-cache add git g++ make py3-pip

RUN yarn global add typescript @vercel/ncc

WORKDIR /usr/app

COPY package.json *.lock *-lock.json ./

RUN yarn import || echo ""

RUN --mount=type=cache,sharing=locked,target=/tmp/.yarn_cache \
    set -ex && \
    yarn install --production --prefer-offline --frozen-lockfile --cache-folder /tmp/.yarn_cache

RUN test -f tsconfig.json || echo "{\"compilerOptions\":{\"esModuleInterop\":true,\"target\":\"es2015\",\"moduleResolution\":\"node\"}}" > tsconfig.json

COPY . .

RUN --mount=type=cache,target=/tmp/ncc-cache \
  ncc build ${HANDLER} -o lib/ -t

FROM node:22.4.1-alpine as final

RUN apk update && \
    apk add --no-cache ca-certificates && \
    update-ca-certificates

WORKDIR /usr/app

COPY . .

COPY --from=build /usr/app/node_modules/ ./node_modules/

COPY --from=build /usr/app/lib/ ./lib/

ENTRYPOINT ["node", "lib/index.js"]