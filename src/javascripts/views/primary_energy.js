window.twentyfifty.views.primary_energy_chart = function() {

  // This is called before the view is first selected
  // and produces the three empty charts
  this.setup = function() {
    $('.primary_energy_notes').show();

    charts = d3.select("#results").selectAll(".chart")
      .data(['demand_chart', 'supply_chart', 'emissions_chart']);

    css_for_labels = {
      'Zemkopība': 'agriculture', //Agriculture
      'Agriculture and land use': 'agriculture',
      'Agriculture, waste, and biomatter imports': 'bioenergy',
      'Biomass oversupply (imports)': 'bioenergy',
      'Bioenergy': 'bioenergy',
      'LV bioenerģija': 'bioenergy', //UK Bioenergy
      'Importētā bioenerģija': 'importedbioenergy', //Imported Bioenergy
      'Bioenerģijas kredīts': 'bioenergy', //Bioenergy credit
      'Importētās akmeņogles': 'importedcoal', //Imported coal
      'LV akmeņogles': 'coal', //UK coal
      'Coal': 'coal',
      'Oglekļa piesaiste': 'carboncapture', //Carbon capture
      'Coal oversupply (imports)': 'coal',
      'Coal reserves': 'coal',
      'Commercial heating and cooling': 'commercialheat',
      'Commercial lighting, appliances, and catering': 'commerciallight',
      'CCS Power': 'ccs',
      'Conventional': 'conventional',
      'District heating effective demand': 'districtheating',
      'Domestic freight': 'domesticfreight',
      'Domestic lighting, appliances, and cooking': 'domesticlight',
      'Domestic passenger transport': 'domesticpassengertransport',
      'Domestic space heating and hot water': 'domesticheat',
      'Electricity oversupply (imports)': 'electricity',
      'Elektrības imports': 'electricity', //Electricity imports
      'Vides siltums': 'environmentalheat', //Environmental heat
      'Degvielas sadegšana': 'fuelcombustion', //Fuel Combustion
      'Gas oversupply (imports)': 'gas',
      'Gas reserves': 'gas',
      'Geosequestration': 'geosequestration',
      'Ģeotermālā enerģija': 'geothermal', //Geothermal
      'Geothermal electricity': 'geothermal',
      'H2 Production for Transport': 'h2',
      'Apsilde & Dzesēšana': 'heatingcooling', //Heating & cooling
      'Heating and cooling': 'heatingcooling',
      'Hidroenerģija': 'hydro', //Hydro
      'Indigenous fossil-fuel production': 'industry',
      'Rūpniecības procesi': 'industry', //Industrial processes
      'Industriālie procesi': 'industry', //Industry
      "Starpt. Aviācija un kuģniecība": 'aviationandshipping',//Int'l Aviation & Shipping
      'Apgaismojums un iekārtas': 'lightingappliances', //Lighting & appliances
      'ZIZIMM': 'lulucf',//LULUCF
      'Natural gas': 'gas',
      'Gas': 'gas',
      'LV gāze': 'gas', //UK gas
      'Importētā gāze': 'importedgas', //Imported Gas
      'Nuclear fission': 'nuclear',
      'Nuclear power': 'nuclear',
      'Oil and petroleum products': 'oil',
      'Oil and petroleum products oversupply (imports)': 'oil',
      'Oil reserves': 'oil',
      'Oil': 'oil',
      'LV nafta': 'oil', //UK Oil
      'Importētā nafta': 'importedoil', //Imported oil
      'Offshore wind': 'offshorewind',
      'Onshore wind': 'onshorewind',
      'Petroleum products oversupply': 'oil',
      'Petroleum refineries': 'industry',
      'Primary electricity, solar, marine, and net imports': 'electricity',
      'Saules enerģija': 'solar', //Solar
      'Solar PV': 'solar',
      'Solar thermal': 'solar',
      'Krasta enerģija': 'tidal', //Tidal
      'Tidal & Wave': 'tidalandwave',
      'Total': 'total',
      'Total³': 'total',
      'Total used in UK': 'total',
      'Total used in UK¹': 'total',
      'Transports': 'transport', //Transport
      'Atkritumi': 'waste', //Waste
      'Viļņu enerģija': 'wave', //Wave
      'Vēja enerģija': 'wind' //Wind
    };

    charts.enter()
      .append('div')
      .attr('id', Object)
      .attr('class', 'chart');

    this.final_energy_chart = timeSeriesStackedAreaChart()
      .title("Gala enerģijas pieprasījums")
      .unit('TJ/yr')
      .css_for_label(css_for_labels)
      .max_value(250000);

    this.primary_energy_chart = timeSeriesStackedAreaChart()
      .title("Primārās enerģijas ieguve")
      .unit('TJ/yr')
      .css_for_label(css_for_labels)
      .max_value(-1000)
      .max_value(850000);

    this.emissions_chart = timeSeriesStackedAreaChart()
      .title("Siltumnīcefekta gāzes emisijas")
      .unit('MtCO2e/yr')
      .css_for_label(css_for_labels)
      .min_value(-20)
      .max_value(65);
  };

  // This is called when a new view has been selected
  // it removes the charts and tidies up.
  this.teardown = function() {
    $('#results').empty();
    this.final_energy_chart = null;
    this.primary_energy_chart = null;
    this.emissions_chart = null;
    $('.primary_energy_notes').hide();
  };


  // This is used to convert the table from how it looks in Excel
  // into the format needed to plot a chart
  convert_table_to_hash = function(table) {
    hash = d3.map();

    // Skip the header row, and put the rest of the table into
    // a Hash table with the key being the first column and the
    // value being the rest
    table.slice(1).forEach(function(row) {
      hash.set(row[0], row.slice(1));
    });
    return hash;
  }

  // This is called when pathway data is loaded
  // or the user chooses a different pathway
  // it updates the charts
  this.updateResults = function(pathway) {

    // Add some footnote references
    //if(pathway.primary_energy_supply[pathway.primary_energy_supply.length-1][0] == "Total used in UK") {
    //  pathway.primary_energy_supply[pathway.primary_energy_supply.length-1][0] =  pathway.primary_energy_supply[pathway.primary_energy_supply.length-1][0] + "¹";
    //}

    //if(pathway.ghg[pathway.ghg.length-2][0] == "Total") {
    //  pathway.ghg[pathway.ghg.length-2][0] =  pathway.ghg[pathway.ghg.length-2][0] + "³";
    //}


    // Get the data in the right format
    demand = convert_table_to_hash(pathway.final_energy_demand);
    supply = convert_table_to_hash(pathway.primary_energy_supply);
    ghg = convert_table_to_hash(pathway.ghg.slice(0,-1));
    percent = pathway.ghg_reduction_from_1990;

    // Draw the charts
    d3.select('#demand_chart')
      .datum(demand)
      .call(this.final_energy_chart);

    d3.select('#supply_chart')
      .datum(supply)
      .call(this.primary_energy_chart);

    d3.select('#emissions_chart')
      .datum(ghg)
      .call(this.emissions_chart);

    // This is to add the target text to the chart
    t = d3.select('#emissions_chart g.drawing').selectAll('text.target')
      .data([percent*100]);

      let gaugeResults = percent;
      if (gaugeResults < 0) {
        gaugeResults = 0;
      }

      if (gaugeResults > 1) {
        gaugeResults = 1;
      }

    $('.column-vertical').animate({
      height: Math.round(gaugeResults*100)+'%',
    });

    $('.column-horizontal').animate({
      width: Math.round(gaugeResults*100)+'%',
    });



    $('.gauge-vertical .label-percent').animate({
      top: Math.round(gaugeResults*100)+'%',
    });

    $('.gauge-horizontal .label-percent').animate({
      left: Math.round(gaugeResults*100)+'%',
    });

    $('.label-percent').text((Math.sign(percent) === 1 ? "-" : "")+Math.abs(Math.round(percent*100))+'%');

    $('.gauge-percent').text(Math.round(percent*100));

    t.enter().append('text')
      .attr('class', 'target');

    t.attr('transform', 'translate(' + this.emissions_chart.x_center() + ',-18)');

    t.transition().tween('text', function(d) {
      current = parseInt(this.textContent) || +d;
      i = d3.interpolateRound(current, +d);
      return function(t) {
        return ''; //this.textContent = "" + (i(t)) + "% samzinājums 1990-2060; Mērķis ir 80%";
      };
    });

   // x = this.emissions_chart.xScale;
   // y = this.emissions_chart.yScale;

    //targets = pathway.ghg[pathway.ghg.length -1].slice(1);

    //t = d3.select('#emissions_chart g.drawing').selectAll('circle.target')
    //  .data(targets);

    //t.enter().append('circle')
    //  .attr('class', 'target')
    //  .attr('r', function(d) { return d == undefined ? 0 : 3 });

    //t.attr('cx', function(d,i) { return x(2020 + (i*5)) });
    //t.attr('cy', function(d,i) { return y(d) });

    //t = d3.select('#emissions_chart g.drawing').selectAll("g.targetlabel")
    //  .data([targets[1]]);

    //new_label = t.enter().append('g')
    //  .attr('class', 'targetlabel');

    //new_label.append('text')
    //  .text("Targets²");

    //t.select('text')
    //  .attr('x', function(d,i) { return x(2020) }) //changed from 2022 to check for graph
    //  .attr('y', function(d,i) { return y(800) });

    //new_label.append('line');

    //t.select('line')
    //  .attr('x1', function(d,i) { return x(2015)+4 })
    //  .attr('y1', function(d,i) { return y(d)-4 })
    // .attr('x2', function(d,i) { return x(2022) })
    //  .attr('y2', function(d,i) { return y(800) });

  };

  return this;
}.call({});
