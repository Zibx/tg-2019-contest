# JS Telegram 2019 March Contest

## How to make a good plotting library

### 0) List of abbreviates // TODO check

- chart, graphic - colored segmented line
- switch - checkbox (input control with two states)
- dot - data item that can be drawn [x, y]
- row - one data // TODO
- time granule - slice of row data. An array of dots in some time period

 
### 1) Make a plan of features
Write down full list of features that you are going to implement and think about architecture. Do not write code for at least 10 minutes -- paper and pencil are your best friends.

This step leads me to ~ this to do list

##### 1. Split layout into 3 parts:
  - Main chart area
  - Navigation area
  - Display data switches
##### 2. Load given data format
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
- X Axis on move (+)
- X Axis on resize
- Y Axis (+)
- graph (+)
- navigation on deselect



### 1) Respect big data and algorithmic complexity
When implement any logic
