// // Import the D3 library
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Draw a line chart
export function drawLineChart(dataset, metric, date, plotwidth, plotheight) {

  // 2. Create chart dimensions
  // -----
  //console.log(plotwidth)
  let dimensions = {
    width: plotwidth,
    height: plotheight,
    margin: {
      top: 90,
      right: 15,
      bottom: 70,
      left: 60,
    },
  }
  dimensions.boundedWidth = dimensions.width 
    - (dimensions.margin.left + dimensions.margin.right)
  dimensions.boundedHeight = dimensions.height
    - (dimensions.margin.top + dimensions.margin.bottom)

  // 3. Draw canvas
  // -----


  // Outer Canvas
  const svg = d3.create("svg")
    .attr("width", dimensions.width)
    .attr("hight", dimensions.height)
  // Inner Canvas
  const bounds = svg.append("g")
    .style("transform", 
      `translate(${
        dimensions.margin.left
      }px, ${
        dimensions.margin.top
      }px)`)

  // To avoid to see the new point until it's within bounds, add clipPath SVG element:
  // It is sized by its children. If a <clipPath> contains a circle, it will only paint 
  // content within that circle's bounds.
  // It can be referenced by another SVG element, using <clipPath>'s id.
  // SVG <defs> element is used to store any re-usable definitions that are used later in the <svg>.
  // // By placing any <clipPath>s or gradients in our <defs> element,
  // // we'll make our code more accessible.

  bounds.append("defs")     // SVG <defs> element stores any re-usable
    .append("clipPath")     // definitions that are used later in the <svg>
      .attr("id", "bounds-clip-path")
    .append("rect")         // To render the rect, add <rect> element that covers the bounds.
      .attr("width", dimensions.boundedWidth)
      .attr("height", dimensions.boundedHeight)

  bounds.append("rect")
    .attr("class", "freezing")

  // // To use <clipPath>, we will create a group with the attribute clip-path pointing
  // // to our <slipPath>'s id. The order in which we draw SVG elements determines their
  // // "z-index," the order of elements (order of overlapping)
  // // Once we define a new group after we draw the freezing <rect>, we can update our path
  // // to sit inside of the new group, instead of the bounds.
  const clip = bounds
    .append("g")
    .attr("clip-path", "url(#bounds-clip-path)")

  clip.append("path")
    .attr("class", "line")
  
  bounds
    .append("g")
      .attr("class", "x-axis")
      .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .append("text")
      .attr("class", "x-axis-label")
  
  bounds
    .append("g")
      .attr("class", "y-axis")
    .append("text")
      .attr("class", "y-axis-label")
  
  bounds
    .append("text")
      .attr("class", "figtitle")

  bounds
    .append("text")
      .attr("class", "figsubtitle")

  // Accessor functions
  const yAccessor = d => d[metric]
  const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z")
  const xAccessor = d => dateParser(d[date])

  // Slice or subset of data set
  let subData = dataset.sort((a, b) => xAccessor(a) - xAccessor(b)).slice(0, 50)

  // 4. Create scales (Y-scale with freezing box)
  // Y-Scale
  const yDomain = d3.extent(dataset, yAccessor)
  const yScale = d3.scaleLinear()
    .domain([0, yDomain[1] * 1.2])
    .range([dimensions.boundedHeight, 0])

  // Freezing temperature
  const freezingTemperaturePlacement = yScale(32)
  const freezingTemperatures = bounds.select(".freezing")
    .attr("x", 0)
    .attr("width", dimensions.boundedWidth)
    .attr("y", freezingTemperaturePlacement)
    .attr("height", dimensions.boundedHeight - freezingTemperaturePlacement)


  const drawLine = datarg => {

    // 4. Create scales (Only X-scale)
    // -----
     
    // X-Scale
    const xScale = d3.scaleTime()
      .domain(d3.extent(datarg, xAccessor))
      .range([0, dimensions.boundedWidth])

    // adjFunt -- function to adjust font size
    let adjFont = fsize => fsize * plotwidth

    // Title
    const figTitle = bounds.select(".figtitle")
      .attr("x", dimensions.margin.left - 60)
      .attr("y", dimensions.margin.top - 140)
      .attr("font-size", String(adjFont(0.002)>2?2:adjFont(0.002)) + "em") 
      .html("Hourly Temperature (&deg;F)");

    // Subtitle
    let xDomain = d3.extent(dataset, xAccessor)
    const titleFormatDate = d3.timeFormat("%B %-d")
    const titleFormatYear = d3.timeFormat("%Y")
    const titleDateDomain = [];
    xDomain.forEach(d => {titleDateDomain.push(titleFormatDate(d))})
    const figSubTitle = bounds.select('.figsubtitle')
      .attr("x", dimensions.margin.left - 60)
      .attr("y", dimensions.margin.top - 110)
      .attr("font-size", String(adjFont(0.0018)>1.8?1.8:adjFont(0.0018)) + "em")
      .text(
        titleDateDomain[0] + " - " + titleDateDomain[1] + ", " + titleFormatYear(xDomain[1])
      )


    // 5. Draw data
    // -----

    const lineGenerator = d3.line()
      .defined(function(d) { return d[metric] })
      .x(d => xScale(xAccessor(d)))
      .y(d => yScale(yAccessor(d)))

    // Once a daily data point is added to update sliced 
    // 100 days of temperatures, d3 transitions each existing point to 
    // the next t + 1 date point at the same index or date t. The `.attr()` 
    // method does not know we have shifted our points down one index.

    // Store the last two date points
    const lastTwoPoints = datarg.slice(-2)
    // Measuring the distance between two scaled x data points
    const pixelsBetweenLastPoints = xScale(xAccessor(lastTwoPoints[1])) 
      - xScale(xAccessor(lastTwoPoints[0]))
    
    const line = bounds.select(".line")
      // .transition().duration(1000)  // 1st initial transition method() without X-axis shift before
                                       // transitioning the line to avoid wiggling movement
        // .attr("fill", "none")
        // .attr("stroke", "#af9358")
        // .attr("stroke-width", 2)
        .attr("d", lineGenerator(datarg))
      // 2nd
        .style("transform", `translateX(${pixelsBetweenLastPoints}px)`)
      .transition().duration(1000)   // Add transition method with 1000 miliseconds (or 1 second)
        .style("transform", `none`)
        // .attr("d", lineGenerator(datarg))

    // 6. Draw peripherals
    // -----

    const yAxisGenerator = d3.axisLeft()
      .scale(yScale)
    const yAxis = bounds.select(".y-axis")
      .call(yAxisGenerator)
      .attr("font-size", String(adjFont(0.0022) > 1.3?1.3:adjFont(0.0022)) + "em")

    
    const xAxisGenerator = d3.axisBottom()
      .scale(xScale)
    const xAxis = bounds.select(".x-axis")
      .transition().duration(1000)        // Add transition method with 1000 miliseconds (or 1 second)
      .call(xAxisGenerator) 
      .attr("font-size", String(adjFont(0.0022) > 1.3?1.3:adjFont(0.0022)) + "em")

    const xAxisLabel = xAxis.select(".x-axis-label")
      .attr("x", dimensions.boundedWidth / 2)
      .attr("y", dimensions.margin.bottom - 20)
      .attr("font-size", String(adjFont(0.0018) > 1.3?1.3:adjFont(0.0018)) + "em")
      .text("Time")

    const listeningRect = bounds.append("rect")
      .attr("class", "listening-rect")
      .attr("width", dimensions.boundedWidth)
      .attr("height", dimensions.boundedHeight)
      .on("mousemove", onMouseMove)
      .on("mouseleave", onMouseLeave)
  
    const tooltip = d3.select("#tooltip00")
  
    const tooltipCircle = bounds.append("circle")
      .attr("class", "tooltip-circle")
      .attr("r", 4)
      .attr("stroke", "#af9358")
      .attr("fill", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0)
  
    function onMouseMove(e) {
      const mousePosition = d3.pointer(e)
      const hoveredDate = xScale.invert(mousePosition[0])
  
      const getDistanceFromHoveredDate = d => Math.abs(xAccessor(d) - hoveredDate)
      const closestIndex = d3.scan(datarg, (a, b) => (
        getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
      ))
      const closestDataPoint = datarg[closestIndex]
  
      const closestXValue = xAccessor(closestDataPoint)
      const closestYValue = yAccessor(closestDataPoint)
  
      const formatDate = d3.timeFormat("%H:%M, %B %A %-d, %Y")
      // console.log(formatDate(closestXValue))
      tooltip.select("#date")
          .text(formatDate(closestXValue))
  
      const formatTemperature = d => `${d3.format(".1f")(d)}°F`
      tooltip.select("#temperature")
          .html(formatTemperature(closestYValue))
  
      const x = xScale(closestXValue)
        + dimensions.margin.left
      const y = yScale(closestYValue)
        + dimensions.margin.top
  
      tooltip.style("transform", `translate(`
        + `calc( -50% + ${x}px),`
        + `calc(+1000% + ${y}px)`
        + `)`)
  
      tooltip.style("opacity", 1)
  
      tooltipCircle
          .attr("cx", xScale(closestXValue))
          .attr("cy", yScale(closestYValue))
          .style("opacity", 1)
    }
  
    function onMouseLeave() {
      tooltip.style("opacity", 0)
  
      tooltipCircle.style("opacity", 0)
    }
  }
  drawLine(subData)


  // Update the line every 1.5 seconds
  setInterval(addNewDay, 1500)    // Global method call a function with a fixed time delay
  function addNewDay() {
    let newDataPoint = generateNewDataPoint(subData, dataset);

    // console.log(newDataPoint[metric]);
    if (newDataPoint[metric] == null) {
      subData = dataset.sort((a, b) => xAccessor(a) - xAccessor(b)).slice(0, 50)
    } else {
      subData = [                       // ... operator (spread syntax) allows iterable 
        ...subData.slice(1),            // remove the oldest day by slicing from the second element
        newDataPoint   // add new day
      ]
      // console.log(newDataPoint)
    }
    drawLine(subData)
  }

  function generateNewDataPoint(subdata, orgdata) {
    // console.log("metric", metric)
    // console.log("date", date)
    // Get the last hour point from subdata
    const lastDataPoint = subdata[subdata.length - 1];
    // Add one more hour by using .timeDay.offset() method
    const nextHour = d3.timeHour.offset(xAccessor(lastDataPoint), 1);
    const retVal = {};
    // console.log(typeof String(nextHour));
    // Get the new hour temperature
    let nextHourTemp = null;
    orgdata.forEach(
      (d) => {
        if (String(xAccessor(d))==String(nextHour)) {
          // console.log(xAccessor(d))
          nextHourTemp = yAccessor(d)
        }
        // console.log(d[date]);
        // xAccessor(d) == nextHour ? nextHourTemp = yAccessor(d) : nextHourTemp = null;
      }
    )
    // console.log("nextHour", nextHour);
    // console.log(nextHourTemp);
    retVal[date] = d3.timeFormat("%Y-%m-%dT%H:%M:%S%Z")(nextHour);
    retVal[metric] = nextHourTemp;
    // console.log(retVal);
    return retVal;
    // {
    //   date: d3.timeFormat("%Y-%m-%dT%H:%M:%S%Z")(nextHour),
    //   // metric: yAccessor(lastDataPoint) + (Math.random() * 6 - 3),
    //   metric: nextHourTemp,
    // }
  }
  return svg.node();
}

