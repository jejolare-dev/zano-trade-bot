import Decimal from "decimal.js";
import OfferType from "./OfferType";
import { MarketState, ParserType } from "./Common";

export interface ConfigItem {
    pair_url: string;
    amount: string;
    price: string;
    type: string;
    trade_id?: string;
    parser_config?: {
        PRICE_INTERVAL_SEC: string;
        PRICE_SELL_PERCENT: string;
        PRICE_BUY_PERCENT: string;
        PRICE_CHANGE_SENSITIVITY_PERCENT: string;
        DEPTH_CHANGE_SENSITIVITY_PERCENT: string;
        PARSER_TYPE: string;
        PAIR_AGAINST_STABLECOIN: string;
        FIRST_CURRENCY: string;
        SECOND_CURRENCY: string;
    }
}

export type Config = ConfigItem[];

export interface ParserConfigPrepared {
    PRICE_INTERVAL_SEC: number;
    PRICE_SELL_PERCENT: number;
    PRICE_BUY_PERCENT: number;
    PRICE_CHANGE_SENSITIVITY_PERCENT: number;
    DEPTH_CHANGE_SENSITIVITY_PERCENT: number;
    PARSER_TYPE: ParserType;
    PAIR_AGAINST_STABLECOIN: boolean;
    FIRST_CURRENCY: string;
    SECOND_CURRENCY: string;
}

export interface ConfigItemParsed {
    pairId: number;
    amount: Decimal;
    price: Decimal;
    type: OfferType;
    trade_id: string | null;
    marketState?: MarketState;
    parser_config?: ParserConfigPrepared
}

export type ConfigParsed = ConfigItemParsed[];