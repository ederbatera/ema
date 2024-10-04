import { lastDataProps } from "./LastDataProps";

export type GlobalContextProps = {
    getLastData: () => void;
    lastData: lastDataProps;
    setLastData: any;
}