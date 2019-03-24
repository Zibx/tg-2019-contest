#### _JS Telegram 2019 March Contest_
# How to make a good chart plotting library
 
### 1) Make a plan of features
Write down full list of features that you are going to implement and think about architecture. Do not write code for at least 10 minutes -- paper and pencil are your best friends.


##### 1. Split layout into 3 parts:
  - Main chart area
  - Navigation area
  - Display data switches
##### 2. Load given data format
Contest data format is too strange. There is no logical reasons for passing chart data in this order, except minor raising of contest complexity.
Suggested format should look this way:
```json5
{
  time: [timestamp1, ..., timestampN],
  rows: {
    "#1": {
        title: "Joined",
        color: "#BEEF11"
        val: [value1, ..., valueN]
      }
    "id": ...
  }
}
```
##### 3. Make another dataset for performance\stress test. 

There is no possibility to push performance to the limit with 100 dotted charts! So, lets make dataset with 7 data rows with 1 million dots in each!
##### 4. Choose between canvas, svg and webgl.
Graphics should be fast enough to draw a lot of segments.
It would be nice if we have 60fps, but I would not call It a `business feature`, charts are usually used by analytics and it is way much important to have ability of loading a really large set of data and navigate in it. So I think that ~10 fps would be enough, but it should not freeze UI (!).

#### Canvas
##### Pros
- Canvas have got everything for drawing polyline
- if we want to squeeze everything from cpu - low level (getContextData) would be the best choice and it leads to manual point by point lines drawing, reinventing antialiasing and segment joint types. 
##### Cons
- Update everything on each frame
- More complex data aggregations

#### SVG
##### Pros
- It was literally created for plotting segments
- It is possible to update parts of graphics separately
##### Cons
- Functions for manipulating with `path` segments were removed from API and now the only way for update segment in line - is full attribute update
 
 #### WebGL
 ##### Pros
 - It can be rotated in 3d with zero cost!
 - It can be covered with shaders, lightning and particle animations!
 
 #### Cons
 - Create mesh on CPU is too boring for getting fun from contest
 - Creating mesh in shader is funnier but it would take too much debug time, especially for making rounded joints.
 
 
SVG was my choice.

##### 5. Plot chart in navigation. 
Do not forget about 7 million points that exists in our crafted dataset.

Optimizations:
- Draw once.
- Do not draw more than one line segment per screen pixel.
- Batch lazy drawing each 10000 to prevent UI freezing

##### 6. Plot big chart
You do not have to draw full chart, only part that would be visible to user, so updating should contain this steps:
- track left\right bound of viewport
- retrieve data in that bound by getting left\right index. `Binary search` is optimal strategy for searching data slice `startIndex` and `endIndex`.
- iterate from `startIndex` to `endIndex` and do not draw more than one segment per `CHART_LINE_WIDTH`
- calculate divergence (TODO check) and find the most odd dot. I want to show peak if it happens in between of timeGranula

##### 7. Navigation window
- Move and resize data window on users interactions.
- Respect touch events (TODO move)

##### 8. Axis Y
- Find out beautifull риски labels in currently visible chart bounds from min to max.
- Update labels on chart updates
- Keep in mind feature animations
- Renderer for long numbers
##### 9. Tooltip
TODO
- Tooltip should not overlap selection circles. Even if there is a full column of circles

##### 10. Axis X
- Labels should be in correct places
- Values should keep their position if view frame is moved

##### 11. Animations
###### X Axis move animation
X Axis values should stay on their places while time frame is moved. It can be easily achieved by calculating diff between `left_chart_bound` mod `full_single_axis_label_interval` and `dataset_start` mod `full_single_axis_label_interval`.
    

###### X Axis on window resize animation
I kept the formula of calculating label positions, and just slightly hinted `dataset_start`. It become a dynamic property that I nail to left or right chart bound on navigation window resizing.  

###### Y Axis
Just make hash of currently displayed values and start `remove` animation when there is no such value in current axis labels. While animation is not finished — value position is keep updating. 

###### Chart vertical scaling
It is the easiest animation, you just have to:
1. Calculate min\max of currently displayed dots
2. Get the median from new `min\max` to `previous_frame_min\max`
3. Move the median closer to previous value to slow down the animation. I used 1/6 of new value mixing up
4. Redraw chart until |`new min\max` – `old min\max`| > `epsilon`
 

###### Disappear and scale chart in navigation




### 1) Respect big data and algorithmic complexity
When implement any logic


__List of abbreviations__

- _chart, graphic_ — colored segmented line
- _switch_ — checkbox (input control with two states)
- _dot_ — minimal amount of data. Contains only `x` and `y` (`time` and `value` in our case)
- _row_ — all dots of the same group ordered by date
- _granule_ — slice of single row (an array of dots in some time period)