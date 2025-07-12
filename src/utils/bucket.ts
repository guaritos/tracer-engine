class Bucket<T> {
    set: Set<T>;
    arr: T[];

    constructor() {
        this.set = new Set();
        this.arr = [];
    }

    add(item: T) {
        if (!this.set.has(item)) {
            this.set.add(item);
            this.arr.push(item);
        }
    }

    removeAllItem() {
        this.set.clear();
        this.arr = [];
    }

    getRandomItem(): T {
        const index = Math.floor((this.arr.length) * Math.random());
        return this.arr[index];
    }
}

export { Bucket };