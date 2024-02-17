import Media from './Media.js';

const win = Widget.Window({
    name: 'mpris',
    anchor: ['top', 'right'],
    child: Media(),
});

export default {
    style: './style.css',
    windows: [win],
};
