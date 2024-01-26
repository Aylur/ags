import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Media from './Media.js';

const win = Widget.Window({
    name: 'mpris',
    child: Media(),
});

export default {
    style: App.configDir + '/style.css',
    windows: [win],
};
