import { ContextualItem } from "./defs";

class PopItem extends ContextualItem {
    node: string = '';  // Node

    constructor(_node: string) {
        super();
        this.node = _node;
    }
}

class StrategySnapshotItem extends ContextualItem {
    data: Record<string, any>;  // Dict
    constructor(data: Record<string, any>) {
        super();
        this.data = data;
    }
}

class RankItem extends ContextualItem {
    data: Record<string, number>;  // Dict
    constructor(data: Record<string, number>) {
        super();
        this.data = data;
    }  
}

class AccountTransferItem extends ContextualItem {
    id: string = '';  // str
    hash: string = '';  // str
    address_from: string = '';  // str
    address_to: string = '';  // str
    value: string = '';  // str
    token_id: string = '';  // str
    timestamp: number = 0;  // int
    block_number: number = 0;  // int
    contract_address: string = '';  // str
    symbol: string = '';  // str
    decimals: number = 0;  // int
    gas: string = '';  // str
    gas_price: string = '';  // str
}

class UTXOTransferItem extends ContextualItem {
    id: string = '';  // str
    tx_from: string = '';  // str
    tx_to: string = '';  // str
    address: string = '';  // str
    value: string = '';  // str
    is_spent: boolean = false;  // bool
    is_coinbase: boolean = false;  // bool
    timestamp: number = 0;  // int
    block_number: number = 0;  // int
    fee: number = 0;  // int
}

export {
    PopItem,
    StrategySnapshotItem,
    RankItem,
    AccountTransferItem,
    UTXOTransferItem,
}