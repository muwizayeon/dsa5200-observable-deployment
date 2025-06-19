// Import the D3 library from D3 content delivery network
import * as d3 from "npm:d3";

// Define an async function to create chart
export function drawBars110(dataset, metric, plotwidth, labelDicts, tooltipId) {
  // 2. Create cart dimensions
  let dimensions = {
    width: plotwidth,
    height: plotwidth * 0.4,
    margin: {
      top: 50,
      right: 10,
      bottom: 50,
      left: 30,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw canvas

  const svg = d3
    .create("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const bounds = svg
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`,
    );

  // init static elements
  bounds.append("g").attr("class", "bins");
  bounds.append("line").attr("class", "mean");
  bounds
    .append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .append("text")
    .attr("class", "x-axis-label");

  const metricAccessor = (d) => d[metric];
  const yAccessor = (d) => d.length;

  // 4. Create scales

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, metricAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const binsGenerator = d3
    .histogram()
    .domain(xScale.domain())
    .value(metricAccessor)
    .thresholds(14);

  const bins = binsGenerator(dataset);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, yAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();

  // 5. Draw data

  const barPadding = 1;

  let binGroups = bounds.select(".bins").selectAll(".bin").data(bins);

  binGroups.exit().remove();

  const newBinGroups = binGroups.enter().append("g").attr("class", "bin");

  newBinGroups.append("rect");
  newBinGroups.append("text");

  // update binGroups to include new points
  binGroups = newBinGroups.merge(binGroups);

  const barRects = binGroups
    .select("rect")
    .attr("x", (d) => xScale(d.x0) + barPadding)
    .attr("y", (d) => yScale(yAccessor(d)))
    .attr("height", (d) => dimensions.boundedHeight - yScale(yAccessor(d)))
    .attr("width", (d) =>
      d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding]),
    );

  // Function to adjust linewidth
  let adjWidth = (wsize) => wsize * plotwidth;

  const mean = d3.mean(dataset, metricAccessor);

  const meanLine = bounds
    .selectAll(".mean")
    .attr("x1", xScale(mean))
    .attr("x2", xScale(mean))
    .attr("y1", -20)
    .attr("y2", dimensions.boundedHeight)
    .attr(
      "stroke-width",
      String(adjWidth(0.005) > 5 ? 5 : adjWidth(0.005)) + "px",
    );

  // 6. Draw Peripherals

  let adjFont = (fsize) => fsize * plotwidth; // function to adjust font size

  const xAxisGenerator = d3.axisBottom().scale(xScale);
  const xAxis = bounds
    .select(".x-axis")
    .call(xAxisGenerator)
    .attr(
      "font-size",
      String(adjFont(0.0022) > 1.3 ? 1.3 : adjFont(0.0022)) + "em",
    );
  const xAxisLabel = xAxis
    .select(".x-axis-label")
    .attr("x", dimensions.boundedWidth / 2)
    .attr("y", dimensions.margin.bottom + 5)
    .attr(
      "font-size",
      String(adjFont(0.004) > 1.3 ? 1.3 : adjFont(0.004)) + "em",
    )
    .html(labelDicts[metric]);

  // 7. Interaction

  // Since we need to update our tooltip text and position when we hover over a bar,
  // let's add our mouseenter and mouseleave event listeners
  binGroups
    .select("rect")
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);

  // Define a tooltip by select the id. tooltip
  const tooltip = d3.select(tooltipId);

  // The onMouseEnter function will receive two arguments, e and datum.
  // The 'e' indicates an event when the mouse hovers on a bar.
  // Since each bar contains a datum, we need those observations to show
  // information on the tooltip.
  function onMouseEnter(e, datum) {
    tooltip
      .select("#count") // id for count number of observations
      .text(yAccessor(datum));

    const formatMetric = d3.format(".1f"); // Change the string format with format specifier string
    tooltip
      .select("#range") // a range of each variable level
      .text([formatMetric(datum.x0), formatMetric(datum.x1)].join(" - "));

    const x =
      xScale(datum.x0) + // Calculate the position of the center of each bar
      (xScale(datum.x1) - xScale(datum.x0)) / 2 +
      dimensions.margin.left;
    const y =
      yScale(yAccessor(datum)) + // Calculate the position of height to place hover tip
      dimensions.margin.top;

    // Let us use our x and y positions to shift our tooltip.
    // Because we are working with a normal xHTML div,
    // we will use the CSS translate property
    tooltip.style(
      "transform",
      `translate(` +
        `calc( 350% + ${x}px),` + // CSS calc() calculates an offset based on values with different units
        `calc( 350% + ${y}px)` + // e.g. Offset our tooltip up half of its own width (-50%) and left -100%
        `)`,
    ); // of its own height. Then add x and y pixel values

    tooltip.style("opacity", 1);
  }

  // The onMouseLeave function will change the tooltip style to
  // disappear when the mouse cursor moves somewhere.
  function onMouseLeave() {
    tooltip.style("opacity", 0);
  }

  return svg.node();
}
