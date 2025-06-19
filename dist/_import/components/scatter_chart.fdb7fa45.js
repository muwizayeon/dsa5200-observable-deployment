import * as d3 from "../../_npm/d3@7.9.0/e780feca.js";

export function drawScatter(
  dataset,
  xmetric,
  ymetric,
  colormetric,
  plotwidth,
  labelDicts,
  tooltipId,
) {
  // 0. Accessors
  const xAccessor = (d) => d[xmetric];
  const yAccessor = (d) => d[ymetric];
  const colorAccessor = (d) => d[colormetric];

  // 2. Create chart dimensions

  let dimensions = {
    width: plotwidth,
    height: plotwidth,
    margin: {
      top: 60,
      right: 10,
      bottom: 70,
      left: 70,
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
  bounds
    .append("g")
    .attr("class", "x-axis")
    .style("transform", `translateY(${dimensions.boundedHeight}px)`)
    .append("text")
    .attr("class", "x-axis-label");
  bounds
    .append("g")
    .attr("class", "y-axis")
    .append("text")
    .attr("class", "y-axis-label");
  bounds.append("text").attr("class", "figtitle");
  bounds.append("text").attr("class", "figsubtitle");

  // 4. Create scales

  // console.table(dataset[0])
  // console.log(d3.extent(dataset, xAccessor))
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0])
    .nice();

  // If we want to assigne color scale based on the colormetric
  const colorScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, colorAccessor)) // we should be create the color scale, too
    .range(["skyblue", "darkslategrey"]);

  const drawDots = (dataset) => {
    // 5. Draw data
    const dots = bounds.selectAll("circle").data(dataset, (d) => d[0]);

    const newDots = dots.enter().append("circle");

    const allDots = newDots
      .merge(dots)
      .attr("cx", (d) => xScale(xAccessor(d)))
      .attr("cy", (d) => yScale(yAccessor(d)))
      .attr("r", 4)
      .attr("fill", (d) => colorScale(colorAccessor(d)));

    const oldDots = dots.exit().remove();
  };
  drawDots(dataset);

  // 6. Draw peripherals

  let adjFont = (fsize) => fsize * plotwidth; // function to adjust font size

  // Title
  const figTitle = bounds
    .select(".figtitle")
    .attr("x", dimensions.margin.left - 74)
    .attr("y", dimensions.margin.top - 90)
    .attr("font-size", String(adjFont(0.004) > 2 ? 2 : adjFont(0.004)) + "em")
    .text("Scatter plot");

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
    .attr("y", dimensions.margin.bottom - 10)
    .attr(
      "font-size",
      String(adjFont(0.004) > 1.3 ? 1.3 : adjFont(0.004)) + "em",
    )
    .html(labelDicts[xmetric]);

  const yAxisGenerator = d3.axisLeft().scale(yScale).ticks(5);

  const yAxis = bounds
    .select(".y-axis")
    .call(yAxisGenerator)
    .attr(
      "font-size",
      String(adjFont(0.0022) > 1.3 ? 1.3 : adjFont(0.0022)) + "em",
    );

  const yAxisLabel = yAxis
    .select(".y-axis-label")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 25)
    .attr(
      "font-size",
      String(adjFont(0.004) > 1.3 ? 1.3 : adjFont(0.004)) + "em",
    )
    .text(labelDicts[ymetric]);

  // 7. Set up interactions

  // // Create the radio buttons
  // const radioButton = d3.select("body")
  //   .append("Container")
  //   .append("radioButton")
  //   .append("checkmark")
  //     .text("Voronoi diagram")

  const delaunay = d3.Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d)),
  );
  const voronoi = delaunay.voronoi();
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;

  bounds
    .selectAll(".voronoi")
    .data(dataset)
    .enter()
    .append("path")
    .attr("class", "voronoi")
    .attr("d", (d, i) => voronoi.renderCell(i))
    // .attr("stroke", "salmon")
    .on("mouseenter", onMouseEnter)
    .on("mouseleave", onMouseLeave);

  const tooltip = d3.select(tooltipId);
  function onMouseEnter(e, datum) {
    const dayDot = bounds
      .append("circle")
      .attr("class", "tooltipDot")
      .attr("cx", xScale(xAccessor(datum)))
      .attr("cy", yScale(yAccessor(datum)))
      .attr("r", 7)
      .style("fill", "maroon")
      .style("pointer-events", "none");

    const formatHumidity = d3.format(".2f");
    tooltip.select("#scatYmetric").text(formatHumidity(yAccessor(datum)));

    const formatDewPoint = d3.format(".2f");
    tooltip.select("#scatXmetric").text(formatDewPoint(xAccessor(datum)));

    const formatCloudCover = d3.format(".2f");
    tooltip.select("#scatCmetric").text(formatCloudCover(xAccessor(datum)));

    const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z");
    const formatDate = d3.timeFormat("%H:%M:%S, %B %A %-d, %Y");
    tooltip.select("#scatTime").text(formatDate(dateParser(datum.date)));

    const x = xScale(xAccessor(datum)) + dimensions.margin.left;
    const y = yScale(yAccessor(datum)) + dimensions.margin.top;

    tooltip.style(
      "transform",
      `translate(` + `calc( -45% + ${x}px),` + `calc(-90% + ${y}px)` + `)`,
    );

    tooltip.style("opacity", 1);
  }

  function onMouseLeave() {
    d3.selectAll(".tooltipDot").remove();

    tooltip.style("opacity", 0);
  }

  return svg.node();
}
