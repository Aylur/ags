> [!NOTE]  
> package dependency: `upower`
> 
> on NixOS enable `services.upower` 

## properties
* `available`: `boolean` whether a battery is available or not
* `percent`: `number` round number from 0 to 100
* `charging`: `boolean`
* `charged`: `boolean` fully charged or percent == 100 and charging
* `icon-name`: `string`
* `time-remaining`: `number` time in seconds until fully charged (when charging) or until it fully drains (when discharging)
* `energy`: `number` - current energy in W
* `energy-full`: `number` capacity in W
* `energy-rate`: `number` - drain rate in W (positive if not charging, negative if charging)

## Example Widgets
```js
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

const batteryProgress = Widget.CircularProgress({
    child: Widget.Icon({
        icon: Battery.bind('icon-name')
    }),
    visible: Battery.bind('available'),
    value: Battery.bind('percent').transform(p => p > 0 ? p / 100 : 0),
    class_name: Battery.bind('charging').transform(ch => ch ? 'charging' : ''),
});
```
