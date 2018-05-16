import * as d3 from 'd3';

// Inspired by http://informationandvisualization.de/blog/box-plot
 d3.boxJitters = function () {
    var width = 1,
        height = 1,
        duration = 0,
        delay = 0,      // New in 2.1.9
        domain = null,
        min = 0,
        max = 0,
        value = Number,
        whiskers = boxWhiskers,
        quartiles = boxQuartiles,
        tickFormat = null,

        // SBC (Added new attributes)
        renderData = false,
        dataRadius = 3,
        dataBoxPercentage = 0.8,
        renderTitle = false,
        showOutliers = true,
        boldOutlier = false,
        outlierClass,
        outlierSize,
        outlierX,
        that = this;


    // For each small multiple…
    let box = (g) => {
        g.each( function (d, i) {
            d = d.map(value).sort(d3.ascending);
            var g = d3.select(this),
                n = d.length;

            // SBC Get out if there are no items.
            if (n === 0) {return;}

            // Compute quartiles. Must return exactly 3 elements.
            // Add temporary quartiles element to data (d) array.
            var quartileData = d.quartiles = quartiles(d);

            // Compute whiskers. Must return exactly 2 elements, or null.
            var whiskerIndices = whiskers && whiskers.call(this, d, i),
                whiskerData = whiskerIndices && whiskerIndices.map( (i) => {
                        return d[i];
                    });

            // Compute outliers. If no whiskers are specified, all data are 'outliers'.
            // We compute the outliers as indices, so that we can join across transitions!
            var outlierIndices = whiskerIndices ?
                d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n)) : d3.range(n);

            // UPGRADE SBC: Determine the maximum value based on if outliers are shown
            if (showOutliers) {
                min = d[0];
                max = d[n - 1];
            }
            else {
                min = d[whiskerIndices[0]];
                max = d[whiskerIndices[1]];
            }
            let pointIndices = d3.range(whiskerIndices[0], whiskerIndices[1] +1);

            // Compute the new x-scale.
            var x1 = d3.scaleLinear()
                .domain(domain && domain.call(this, d, i) || [min, max])
                .range([height, 0]);

            // Retrieve the old x-scale, if this is an update.
            var x0 = this.__chart__ || d3.scaleLinear()
                    .domain([0, Infinity])
                    .range(x1.range());

            // Stash the new scale.
            this.__chart__ = x1;

            // Note: the box, median, and box tick elements are fixed in number,
            // so we only have to handle enter and update. In contrast, the outliers
            // and other elements are variable, so we need to exit them! Variable
            // elements also fade in and out.

            // Update center line: the vertical line spanning the whiskers.
            var center = g.selectAll('line.center')
                .data(whiskerData ? [whiskerData] : []);

            center.enter().insert('line', 'rect')
                .attr('class', 'center')
                .attr('x1', width / 2)
                .attr('y1', function (d) {return x0(d[0])})
                .attr('x2', width / 2)
                .attr('y2', function (d) {return x0(d[1])})
                .style('opacity', 1e-6)
                .transition()
                .duration(duration)
                .delay(delay)
                .style('opacity', 1)
                .attr('y1', function (d) {return x1(d[0])})
                .attr('y2', function (d) {return x1(d[1])});

            center.transition()
                .duration(duration)
                .delay(delay)
                .style('opacity', 1)
                .attr('x1', width / 2)
                .attr('x2', width / 2)
                .attr('y1', function (d) {return x1(d[0])})
                .attr('y2', function (d) {return x1(d[1])});

            center.exit().transition()
                .duration(duration)
                .delay(delay)
                .style('opacity', 1e-6)
                .attr('y1', function (d) {return x1(d[0])})
                .attr('y2', function (d) {return x1(d[1])})
                .remove();

            // Update innerquartile box.
            var box = g.selectAll('rect.box')
                .data([quartileData]);

            box.enter().append('rect')
                .attr('class', 'box')
                .attr('x', 0)
                .attr('y', function (d) {return x0(d[2])})
                .attr('width', width)
                .attr('height', function (d) {return x0(d[0]) - x0(d[2])})
                .style('fill-opacity', (renderData) ? 0.1 : 1)
                .transition()
                .duration(duration)
                .delay(delay)
                .attr('y', function (d) {return x1(d[2])})
                .attr('height', function (d) {return x1(d[0]) - x1(d[2])});

            box.transition()
                .duration(duration)
                .delay(delay)
                .attr('width', width)
                .attr('y', function (d) {return x1(d[2])})
                .attr('height', function (d) {return x1(d[0]) - x1(d[2])});

            // Update median line.
            var medianLine = g.selectAll('line.median')
                .data([quartileData[1]]);

            medianLine.enter().append('line')
                .attr('class', 'median')
                .attr('x1', 0)
                .attr('y1',  x0)
                .attr('x2', width)
                .attr('y2', x0)
                .transition()
                .duration(duration)
                .delay(delay)
                .attr('y1', x1)
                .attr('y2', x1);

            medianLine.transition()
                .duration(duration)
                .delay(delay)
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', x1)
                .attr('y2', x1);

            // Update whiskers.
            var whisker = g.selectAll('line.whisker')
                .data(whiskerData || []);

            whisker.enter().insert('line', 'circle, text')
                .attr('class', 'whisker')
                .attr('x1', 0)
                .attr('y1', x0)
                .attr('x2', width)
                .attr('y2', x0)
                .style('opacity', 1e-6)
                .transition()
                .duration(duration)
                .delay(delay)
                .attr('y1', x1)
                .attr('y2', x1)
                .style('opacity', 1);

            whisker.transition()
                .duration(duration)
                .delay(delay)
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', x1)
                .attr('y2', x1)
                .style('opacity', 1);

            whisker.exit().transition()
                .duration(duration)
                .delay(delay)
                .attr('y1', x1)
                .attr('y2', x1)
                .style('opacity', 1e-6)
                .remove();

            // Update outliers.
            if (showOutliers) {
                outlierClass = boldOutlier ? 'outlierBold' : 'outlier';
                outlierSize = boldOutlier ? 3 : 5;
                outlierX = boldOutlier
                    ? function () { return Math.floor(Math.random() * (width * dataBoxPercentage) + 1 + ((width - (width * dataBoxPercentage)) / 2))}
                    : function () {return width / 2};

                var outlier = g.selectAll('circle.'+outlierClass)
                    .data(outlierIndices, Number);

                outlier.enter().insert('circle', 'text')
                    .attr('class', outlierClass)
                    .attr('r', outlierSize)
                    .attr('cx', outlierX)
                    .attr('cy', function (i) {return x0(d[i])})
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .delay(delay)
                    .attr('cy', function (i) {return x1(d[i])})
                    .style('opacity', 0.6);

                if (renderTitle) {
                    outlier.selectAll('title').remove();
                    outlier.append('title').text(function (i) {return d[i]});
                }

                outlier.transition()
                    .duration(duration)
                    .delay(delay)
                    .attr('cx', outlierX)
                    .attr('cy', function (i) {return x1(d[i])})
                    .style('opacity', 0.6);

                outlier.exit().transition()
                    .duration(duration)
                    .delay(delay)
                    .attr('cy', 0) //function (i) {return x1(d[i])})
                    .style('opacity', 1e-6)
                    .remove();
            }

            // Update Values
            if (renderData) {
                var point = g.selectAll('circle.data')
                    .data(pointIndices);

                point.enter().insert('circle', 'text')
                    .attr('class', 'data')
                    .attr('r', dataRadius)
                    .attr('cx', function () {return Math.floor(Math.random() * (width * dataBoxPercentage) + 1 + ((width - (width * dataBoxPercentage)) / 2))})
                    .attr('cy', function (i) {return x0(d[i])})
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .delay(delay)
                    .attr('cy', function (i) {
                        return x1(d[i])})
                    .style('opacity', 0.2);

                if (renderTitle) {
                    point.selectAll('title').remove();
                    point.append('title').text(function (i) {return d[i]});
                }

                point.transition()
                    .duration(duration)
                    .delay(delay)
                    .attr('cx', function () {return Math.floor(Math.random() * (width * dataBoxPercentage) + 1 + ((width - (width * dataBoxPercentage)) / 2))})
                    .attr('cy', function (i) {
                        return x1(d[i])})
                    .style('opacity', 0.2);

                 point.exit().transition()
                     .duration(duration)
                     .delay(delay)
                     .attr('cy', 0)
                     .style('opacity', 1e-6)
                     .remove();
            }

            // Compute the tick format.
            var format = tickFormat || x1.tickFormat(8);

            // Update box ticks.
            var boxTick = g.selectAll('text.box')
                .data(quartileData);

            boxTick.enter().append('text')
                .attr('class', 'box')
                .attr('dy', '.3em')
                .attr('dx', function (d, i) {
                    return i & 1 ? 6 : -6;
                })
                .attr('x', function (d, i) {
                    return i & 1 ? width : 0;
                })
                .attr('y', x0)
                .attr('text-anchor', function (d, i) {
                    return i & 1 ? 'start' : 'end';
                })
                .text(format)
                .transition()
                .duration(duration)
                .delay(delay)
                .attr('y', x1);

            boxTick.transition()
                .duration(duration)
                .delay(delay)
                .text(format)
                .attr('x', function (d, i) { return i & 1 ? width : 0; })
                .attr('y', x1);

            // Update whisker ticks. These are handled separately from the box
            // ticks because they may or may not exist, and we want don't want
            // to join box ticks pre-transition with whisker ticks post-.
            var whiskerTick = g.selectAll('text.whisker')
                .data(whiskerData || []);

            whiskerTick.enter().append('text')
                .attr('class', 'whisker')
                .attr('dy', '.3em')
                .attr('dx', 6)
                .attr('x', width)
                .attr('y', x0)
                .text(format)
                .style('opacity', 1e-6)
                .transition()
                .duration(duration)
                .delay(delay)
                .attr('y', x1)
                .style('opacity', 1);

            whiskerTick.transition()
                .duration(duration)
                .delay(delay)
                .text(format)
                .attr('x', width)
                .attr('y', x1)
                .style('opacity', 1);

            whiskerTick.exit().transition()
                .duration(duration)
                .delay(delay)
                .attr('y', x1)
                .style('opacity', 1e-6)
                .remove();

            // Remove temporary quartiles element from within data array.
            delete d.quartiles;
        });
        that.timerFlush();
    }

    box.width = function (x) {
        if (!arguments.length) {
            return width;
        }
        width = x;
        return box;
    };

    box.height = function (x) {
        if (!arguments.length) {
            return height;
        }
        height = x;
        return box;
    };

    box.tickFormat = function (x) {
        if (!arguments.length) {
            return tickFormat;
        }
        tickFormat = x;
        return box;
    };

    box.showOutliers = function (x) {
        if (!arguments.length) {
            return showOutliers;
        }
        showOutliers = x;
        return box;
    };

    box.boldOutlier = function (x) {
        if (!arguments.length) {
            return boldOutlier;
        }
        boldOutlier = x;
        return box;
    };


    box.renderData = function (x) {
        if (!arguments.length) {
            return renderData;
        }
        renderData = x;
        return box;
    };

    box.renderTitle = function (x) {
        if (!arguments.length) {
            return renderTitle;
        }
        renderTitle = x;
        return box;
    };

    box.dataBoxPercentage = function (x) {
        if (!arguments.length) {
            return dataBoxPercentage;
        }
        dataBoxPercentage = x;
        return box;
    };

    box.duration = function (x) {
        if (!arguments.length) {
            return duration;
        }
        duration = x;
        return box;
    };

    box.domain = (x) => {
        if (!arguments.length) {
            return domain;
        }
        domain = x === null ? x : d3.functor(x);
        return box;
    };

    box.value = function (x) {
        if (!arguments.length) {
            return value;
        }
        value = x;
        return box;
    };

    box.whiskers = function (x) {
        if (!arguments.length) {
            return whiskers;
        }
        whiskers = x;
        return box;
    };

    box.quartiles = function (x) {
        if (!arguments.length) {
            return quartiles;
        }
        quartiles = x;
        return box;
    };

    return box;
};

function boxWhiskers(d) {
    return [0, d.length - 1];
}

function boxQuartiles(d) {
    return [
        d3.quantile(d, 0.25),
        d3.quantile(d, 0.5),
        d3.quantile(d, 0.75)
    ];
}
