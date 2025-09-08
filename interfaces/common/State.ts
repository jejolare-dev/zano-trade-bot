import SocketClient from "../../utils/socket";

export interface ActiveThread {
    socket: SocketClient;
    id: string;
    threadID: string;
}


export interface State {
    activeThreads: ActiveThread[];
    threadsToRestart: ActiveThread[];
}
