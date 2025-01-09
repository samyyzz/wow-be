"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareThisHash = void 0;
const shareThisHash = (len) => {
    let options = "asd123ASDzxc456qwePOI";
    let optLength = options.length;
    let hash = "";
    for (let i = 0; i < len; i++) {
        hash += options[Math.floor(Math.random() * optLength)];
    }
    return hash;
};
exports.shareThisHash = shareThisHash;
