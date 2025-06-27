# Builtin Intrinsic Elements

These are just Gtk widgets which can be used without explicitly importing. For
example `<box />` and `<Gtk.Box />` are exactly the same thing.

## Gtk4

### box

[Gtk.Box](https://docs.gtk.org/gtk4/class.Box.html)

```tsx
<box orientation={Gtk.Orientation.HORIZONTAL}>
  <Child />
  <Child />
  <Child />
</box>
```

### button

[Gtk.Button](https://docs.gtk.org/gtk4/class.Button.html)

```tsx
<button onClicked={() => print("clicked")}>
  <Child />
</button>
```

### centerbox

[Gtk.CenterBox](https://docs.gtk.org/gtk4/class.CenterBox.html)

```tsx
<centerbox orientation={Gtk.Orientation.HORIZONTAL}>
  <Child $type="start" />
  <Child $type="center" />
  <Child $type="end" />
</centerbox>
```

### drawingarea

[Gtk.DrawingArea](https://docs.gtk.org/gtk4/class.DrawingArea.html)

```tsx
<drawingarea
  $={(self) =>
    self.set_draw_func((area, cr, width, height) => {
      //
    })
  }
/>
```

### entry

[Gtk.Entry](https://docs.gtk.org/gtk4/class.Entry.html)

```tsx
<entry
  placeholderText="Start typing..."
  text=""
  onNotifyText={({ text }) => print(text)}
/>
```

### image

[Gtk.Image](https://docs.gtk.org/gtk4/class.Image.html)

```tsx
<image
  file="/path/to/file.png"
  iconName="system-search-symbolic"
  pixelSize={16}
/>
```

### label

[Gtk.Label](https://docs.gtk.org/gtk4/class.Label.html)

```tsx
<label
  label="<span foreground='blue'>text</span>"
  useMarkup
  wrap
  ellipsize={Pango.EllipsizeMode.END}
/>
```

### levelbar

[Gtk.LevelBar](https://docs.gtk.org/gtk4/class.LevelBar.html)

```tsx
<levelbar
  orientation={Gtk.Orientation.HORIZONTAL}
  widthRequest={200}
  value={0.5}
/>
```

### menubutton

[Gtk.MenuButton](https://docs.gtk.org/gtk4/class.MenuButton.html)

```tsx
<menubutton>
  button content
  <popover>popover content</popover>
</menubutton>
```

### overlay

[Gtk.Overlay](https://docs.gtk.org/gtk4/class.Overlay.html)

```tsx
<overlay>
  <Child />
  <Child $type="overlay" />
  <Child $type="overlay" />
</overlay>
```

### revealer

[Gtk.Revealer](https://docs.gtk.org/gtk4/class.Revealer.html)

```tsx
<revealer
  transitionType={Gtk.RevealerTransitionType.SLIDE_RIGHT}
  revealChild={true}
  onNotifyChildRevealed={() => print("animation finished")}
>
  <Child />
</revealer>
```

### scrolledwindow

[Gtk.ScrolledWindow](https://docs.gtk.org/gtk4/class.ScrolledWindow.html)

```tsx
<scrolledwindow maxContentHeight={500}>
  <Child />
</scrolledwindow>
```

### slider

[Astal.Slider](https://aylur.github.io/libastal/astal4/class.Slider.html)

```tsx
<slider
  value={0.5}
  min={0}
  max={1}
  onChangeValue={({ value }) => print(value)}
/>
```

### stack

[Gtk.Stack](https://docs.gtk.org/gtk4/class.Stack.html)

```tsx
<stack $={(self) => (self.visibleChildName = "child2")}>
  <Child $type="named" name="child1" />
  <Child $type="named" name="child2" />
</stack>
```

### switch

[Gtk.Switch](https://docs.gtk.org/gtk4/class.Switch.html)

```tsx
<switch active={true} onNotifyActive={({ active }) => print(active)} />
```

### togglebutton

[Gtk.ToggleButton](https://docs.gtk.org/gtk4/class.ToggleButton.html)

```tsx
<togglebutton active={true} onToggled={({ active }) => print(active)} />
```

### window

[Astal.Window](https://aylur.github.io/libastal/astal4/class.Window.html)

```tsx
<window
  visible
  namespace="bar"
  class="Bar"
  monitor={0}
  exclusivity={Astal.Exclusivity.EXCLUSIVE}
  keymode={Astal.Keymode.ON_DEMAND}
  anchor={
    Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT
  }
/>
```

## Gtk3

### box

[Gtk.Box](https://docs.gtk.org/gtk3/class.Box.html)

```tsx
<box orientation={Gtk.Orientation.HORIZONTAL}>
  <Child />
  <Child />
  <Child />
</box>
```

### button

[Gtk.Button](https://docs.gtk.org/gtk3/class.Button.html)

```tsx
<button onClicked={() => print("clicked")}>
  <Child />
</button>
```

### centerbox

[Astal.CenterBox](https://aylur.github.io/libastal/astal3/class.CenterBox.html)

```tsx
<centerbox orientation={Gtk.Orientation.HORIZONTAL}>
  <Child $type="start" />
  <Child $type="center" />
  <Child $type="end" />
</centerbox>
```

### circularprogress

[Astal.CircularProgress](https://aylur.github.io/libastal/astal3/class.CircularProgress.html)

```tsx
<circularprogress value={0.5} startAt={0.75} endAt={0.75}>
  <icon />
</circularprogress>
```

```css
circularprogress {
  color: green;
  background-color: black;
  font-size: 6px;
  margin: 2px;
  min-width: 32px;
}
```

### drawingarea

[Gtk.DrawingArea](https://docs.gtk.org/gtk3/class.DrawingArea.html)

```tsx
<drawingarea
  onDraw={(self, cr) => {
    //
  }}
/>
```

### entry

[Gtk.Entry](https://docs.gtk.org/gtk3/class.Entry.html)

```tsx
<entry
  onChanged={({ text }) => print("text changed", text)}
  onActivate={({ text }) => print("enter", text)}
/>
```

### eventbox

[Astal.EventBox](https://aylur.github.io/libastal/astal3/class.EventBox.html)

```tsx
<eventbox
  onClick={(_, event) => {
    print(event.modifier, event.button)
  }}
/>
```

### icon

[Astal.Icon](https://aylur.github.io/libastal/astal3/class.Icon.html)

```tsx
<icon
  // named icon or path to a file
  icon="/path/to/file.png"
  icon="missing-symbolic"
/>
```

```css
icon {
  font-size: 16px;
}
```

### label

[Astal.Label](https://aylur.github.io/libastal/astal3/class.Label.html)

```tsx
<label label="hello" maxWidthChars={16} wrap />
```

### levelbar

[Astal.LevelBar](https://aylur.github.io/libastal/astal3/class.LevelBar.html)

```tsx
<levelbar value={0.5} widthRequest={200} />
```

### overlay

[Astal.Overlay](https://aylur.github.io/libastal/astal3/class.Overlay.html)

```tsx
<overlay>
  <Child>child</Child>
  <Child>overlay 1</Child>
</overlay>
```

### revealer

[Gtk.Revealer](https://docs.gtk.org/gtk3/class.Revealer.html)

```tsx
<revealer
  transitionType={Gtk.RevealerTransitionType.SLIDE_RIGHT}
  revealChild={true}
  onNotifyChildRevealed={() => print("animation finished")}
>
  <Child />
</revealer>
```

### scrollable

[Astal.Scrollable](https://aylur.github.io/libastal/astal3/class.Scrollable.html)

```tsx
<scrollable heightRequest={100}>
  <Child />
</scrollable>
```

### slider

[Astal.Slider](https://aylur.github.io/libastal/astal3/class.Slider.html)

```tsx
<slider widthRequest={100} onDragged={({ value }) => print(value)} />
```

### stack

[Astal.Stack](https://aylur.github.io/libastal/astal3/class.Stack.html)

```tsx
<stack $={(self) => (self.visibleChildName = "child2")}>
  <Child name="child1" />
  <Child name="child2" />
</stack>
```

### switch

[Gtk.Switch](https://docs.gtk.org/gtk3/class.Switch.html)

```tsx
<switch active={true} onNotifyActive={({ active }) => print(active)} />
```

### overlay

[Astal.Overlay](https://aylur.github.io/libastal/astal3/class.Overlay.html)

```tsx
<overlay>
  <Child>child</Child>
  <Child>overlay 1</Child>
  <Child>overlay 1</Child>
</overlay>
```

### togglebutton

[Gtk.ToggleButton](https://docs.gtk.org/gtk4/class.ToggleButton.html)

```tsx
<togglebutton active={true} onToggled={({ active }) => print(active)} />
```

### window

[Astal.Window](https://aylur.github.io/libastal/astal4/class.Window.html)

```tsx
<window
  visible
  namespace="bar"
  class="Bar"
  monitor={0}
  exclusivity={Astal.Exclusivity.EXCLUSIVE}
  keymode={Astal.Keymode.ON_DEMAND}
  anchor={
    Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT
  }
/>
```
