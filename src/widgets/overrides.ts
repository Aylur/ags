import Gtk from 'gi://Gtk?version=3.0';

function toggleClassName(
    widget: Gtk.Widget,
    className: string,
    condition = true,
) {
    condition
        ? widget.get_style_context().add_class(className)
        : widget.get_style_context().remove_class(className);
}

Object.defineProperty(Gtk.Widget.prototype, 'className', {
    get: function() {
        return this._className || [];
    },
    set: function(names: string[] | string) {
        if (!Array.isArray(names) && typeof names !== 'string') {
            console.error('className has to be a string or array');
            return;
        }

        if (this._className) {
            this._className.forEach((cn: string) =>
                toggleClassName(this, cn, false));
        }

        this._className = [];
        if (typeof names === 'string')
            names = names.split(/\s+/);

        for (const cn of names) {
            toggleClassName(this, cn);
            this._className.push(cn);
        }
    },
});

const widgetProviders: Map<Gtk.Widget, Gtk.CssProvider> = new Map();
function setStyle(widget: Gtk.Widget, css: string) {
    if (typeof css !== 'string') {
        console.error('style has to be a string');
        return false;
    }

    const previous = widgetProviders.get(widget);
    if (previous)
        widget.get_style_context().remove_provider(previous);

    const provider = new Gtk.CssProvider();
    widgetProviders.set(widget, provider);
    provider.load_from_data(`* { ${css} }`);
    widget.get_style_context()
        .add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
}

Object.defineProperty(Gtk.Widget.prototype, 'style', {
    get: function() {
        return this._style || '';
    },
    set: function(css: string) {
        if (!setStyle(this, css))
            return;

        this._style = css;
    },
});

function setCSS(widget: Gtk.Widget, css: string) {
    if (typeof css !== 'string') {
        console.error('css has to be a string');
        return false;
    }

    const previous = widgetProviders.get(widget);
    if (previous)
        widget.get_style_context().remove_provider(previous);

    const provider = new Gtk.CssProvider();
    widgetProviders.set(widget, provider);
    provider.load_from_data(`${css}`);
    widget.get_style_context()
        .add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
}

Object.defineProperty(Gtk.Widget.prototype, 'css', {
    get: function() {
        return this._css || '';
    },
    set: function(css: string) {
        if (!setCSS(this, css))
            return;

        this._css = css;
    },
});

// @ts-expect-error
Gtk.Widget.prototype.setCSS = function(css: string) {
    setCSS(this, css);
};

// @ts-expect-error
Gtk.Widget.prototype.setStyle = function(css: string) {
    setStyle(this, css);
};

// @ts-expect-error
Gtk.Widget.prototype.toggleClassName = function(cn: string, condition = true) {
    toggleClassName(this, cn, condition);
};

Object.defineProperty(Gtk.Bin.prototype, 'child', {
    get: function() {
        return this.get_child();
    },
    set: function(child: Gtk.Widget | null) {
        const widget = this.get_child();
        if (widget === child)
            return;

        if (widget)
            widget.destroy();

        if (child)
            this.add(child);
    },
});
