/// <reference path="../neo-sdk/neo-ts.d.ts" />
declare namespace App {
    class CreateAndSignMulti {
        keys: Array<key>;
        key: key;
        bError: boolean;
        tx: Tx;
        start(): void;
    }
}
