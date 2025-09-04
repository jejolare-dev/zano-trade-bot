import { ConfigItemParsed, ParserConfigPrepared } from "./Config";
import PairData from "./PairData";

export type NotificationParams = [
    string,
    number,
    PairData,
    string | null,
    ConfigItemParsed
];
export interface PriceInfo {
    buy: number | null;
    sell: number | null;
    depthToSell: number | null;
    depthToBuy: number | null;
}

export type ParserType = 'mexc' | 'bitcom';
export const allowedParserTypes: ParserType[] = ['mexc', 'bitcom'];

export interface ParserHandlerProps {
    config: ParserConfigPrepared;
}

export interface MarketState {
    marketPrice: number | null;
    updatedAt: number | null;
    buyPrice: number | null;
    sellPrice: number | null;
    zanoPrice: number | null;
    depthToSell: number | null;
    depthToBuy: number | null;
}

export interface Order {
    type: 'buy' | 'sell';
    price: string;
    baseVolume: string;
    baseVolumeUSD: string;
}