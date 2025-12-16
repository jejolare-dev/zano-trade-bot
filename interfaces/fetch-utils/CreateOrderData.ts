import OfferType from '../common/OfferType';
import Side from '../common/Side';

interface CreateOrderData {
    type: OfferType;
    side: Side;
    price: string;
    amount: string;
    pairId: number;
}

export default CreateOrderData;
