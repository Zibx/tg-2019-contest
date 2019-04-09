#### _JS Telegram 2019 March Contest_
# How to make a good chart plotting library
 
## A) Make a list of features
Write down the full list of features that you are going to implement and take a break to think about architecture. It is a good practice for building anything larger than `hello-world` app. 


### 1. Split layout into 3 parts:
  - Main chart area
  - Navigation area
  - Data switches display

### 2. Load given data format

### 3. Choose visualization technique

### 4. Plot chart in the navigation area

### 5. Plot visible part of big chart

### 6. User interactions
  - click on chart → show point tooltip
  - resize view area
  - move view area

### 7. Animations
  
## B) Draw the rest of the owl

At the first sight, it was a simple task, so I want to describe pitfalls that were solved.

### Canvas, SVG or webGL
Rendering should be fast enough to draw a lot of chart segments.
It would be nice if our chart would have smooth framerate. It is not really a `business feature` for this type of widget, because charts are usually used by analytics and their first priority is to load without crushing on really large data sets. But we can try to do our best and prevent widget from freeze UI up by using lazy batching techniques.

#### Canvas
##### Pros
- Canvas has got everything for drawing polyline
##### Cons
- Updating everything on each frame
- Complex animations logic — we have to do it by hand
- if we want to squeeze everything from our cpu — we must go to the low level (getContextData) and make manual point by point line drawing, reinventing antialiasing and segment joint types. 

#### SVG
##### Pros
- It was literally created for plotting segments
- It is possible to update parts of graphics separately
##### Cons
- Functions for manipulating with `path` segments were removed from API and now the only way to update segment in line is full attribute update
 
 #### WebGL
 ##### Pros
 - It can be rotated in 3d for zero cost!
 - It can be covered with shaders, lightning and particle animations!
 
 #### Cons
 - Creating mesh on CPU is too boring for getting fun from contest
 - Creating mesh in shader is funnier but it would take too much debug time, especially for making rounded joints.
 
 SVG was my choice.

### Test data
Beeing an engineer who's always thinking "How would it scale if there would be much more data?" I made my own dataset that contains 7 rows of data with one million points in each.

This approach leads me to optimization techniques that have `log(N)` complexity. Never use dummy element by element lookups — use `binary search` or make some `hashs`.

##### Data Format

Contest data format was too strange. There is no logical reason for passing chart data in this structure, except minor raising contest complexity.
It would be better to use such data mapping:
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

### Plot chart in navigation. 
Do not forget about 7 million points that exists in our crafted dataset.

##### Draw once
Navigation does not scroll, it only scales vertically. It would be nice to make this small chart previews only in data loading step and in screen resize.
##### Do not draw things that people would not see
When you have a really huge amount of data — you can reduce it at least to the count of pixels on the screen.

##### Batch lazy drawing to prevent UI freezing
Use delays to process data in reasonable sized batches.

### Plot big chart

Do not draw the full chart, you should only render parts that are currently visible to user:
- Track left\right bound of viewport and retrieve only corresponding data. `Binary search` is an optimal strategy for searching data slice `startIndex` and `endIndex`.
- Iterate from `startIndex` to `endIndex` and do not draw more than one segment per `CHART_LINE_WIDTH`. You can even skip some points.
- In my case I've choose to calculate the most odd dots in every visible segment, but it was not necessery.

### Navigation window
- Move and resize data window on user interactions
- Respect touch events

### Axis Y
- Find out beautiful labels in currently visible chart bounds from min to max.
- Update labels on chart updates
- Keep in mind future animations
- Renderer for long numbers

### Axis X
- Labels should be in correct places
- Values should keep their position if view frame is moved

### Animations
It was the hardest part of the task for me
#### X Axis move animation
X Axis values should stay on their places while time frame is moved. It can be easily achieved by calculating diff between `left_chart_bound` mod `full_single_axis_label_interval` and `dataset_start` mod `full_single_axis_label_interval`.
    

#### X Axis on window resize animation
I kept the formula of calculating label positions, and just slightly hinted `dataset_start`. It become a dynamic property that I nail to left or right chart bound on navigation window resizing.

#### Y Axis
Just make hash of currently displayed values and start `remove` animation when there is no such value in current axis labels. Value position keeps updating while animation is not finished.

#### Chart vertical scaling
It is the easiest one, so you just have to:
1. Calculate min\max of currently displayed dots
2. Get the median from new `min\max` to `previous_frame_min\max`
3. Move the median closer to previous value to slow down the animation. I used 1/6 of new value mixing up
4. Redraw chart until |`new min\max` – `old min\max`| > `epsilon`
 

#### Disappear and scale chart in navigation


# TLDR.
It was a really good contest with a bunch of pitfalls. Writing code and making choices process was similar to tasks that you can get in normal IT companies, so now I think that TG is searching for developers and it was just a test task.

I would place all code in my public github account at the 1 of April @Zibx.



__List of abbreviations__

- _chart, graphic_ — colored segmented line
- _switch_ — checkbox (input control with two states)
- _dot_ — minimal amount of data. Contains only `x` and `y` (`time` and `value` in our case)
- _row_ — all dots of the same group ordered by date
- _granule_ — slice of single row (an array of dots in some time period)