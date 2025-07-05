class ContextualItem {
    _cb_kwargs: Record<string, any>;
    /**
     * ContextualItem is a base class for items that can have context-specific
     * keyword arguments. It allows setting and getting context-specific
     * keyword arguments.
     *
     * @param args - Positional arguments (not used in this implementation).
     * @param kwargs - Keyword arguments, can include 'cb_kwargs' to initialize
     *                 the context-specific keyword arguments.
     */
    constructor(kwargs: Record<string, any> = {}) {
        this._cb_kwargs = {};
        if (kwargs['cb_kwargs']) {
            this._cb_kwargs = kwargs['cb_kwargs'];
        }
    }

    set_context_kwargs(kwargs: Record<string, any>): void {
        if (typeof kwargs !== 'object' || kwargs === null) {
            throw new Error('ContextualItem kwargs must be an object');
        }
        this._cb_kwargs = { ...this._cb_kwargs, ...kwargs };
    }

    get_context_kwargs(): Record<string, any> {
        return this._cb_kwargs;
    }
}

export {
    ContextualItem,
}