import { Order } from "../../interfaces/common/Common";

export function calcDepth(orders: Order[], type: 'buy' | 'sell', targetPrice: number, multiplier?: number) {
    const volumeToTargetPrice = orders.reduce((sum, order) => {
        if (parseFloat(order.price) >= targetPrice && type === 'buy') {
            return sum + parseFloat(order['baseVolumeUSD']);
        } else if (parseFloat(order.price) <= targetPrice && type === 'sell') {
            return sum + parseFloat(order['baseVolumeUSD']) * (multiplier || 1);
        }
        return sum;
    }, 0);

    return volumeToTargetPrice;
}