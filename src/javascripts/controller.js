(function() {

  // This object contains a series of properties, where the name of the property
  // matches the name of the view as used in the URl and the value of the property
  // is a function that manages that view and is defined in the views/ folder.
  // e.g.: views.primary_energy = { setup: ..., teardown: ..., updateResults: ... } // defined in views/primary_energy.js
  views = {};
  // This property contains the currently active view. That object is defined in the views/ folder
  // and will respond to setup(), teardown() and updateResults(new_pathway)
  active_view = null;

  // FIXME: Wrap this in a state object
  controller = null;
  choices = null;
  view = null;
  sector = null; // FIXME: Rename to sub_view.
  comparator = null;
  old_choices = [];

  // FIXME: Where is the right spot for this?
  cache = {};

  // This is the first thing that gets called when everything has been loaded.
  // It wires up the controls, sets up the initial view and loads the first
  // pathway.
  $(document).ready( function() {
    checkSVGWorks();
    setUpControls();
    setVariablesFromURL();
    switchView(view);
    loadMainPathway();
  });

  // Some of the graphs require SVG, which is only supported in modern browsers (Internet Explorer >8)
  // This function checks that SVG is supported, and if not reveals a warning block that is
  // in src/index.html.erb
  checkSVGWorks = function() {
    if (!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect) { return; }
    $("#svgWarn").show();
  };

  // The controls are a series of tables in src/index.html.erb in the #classic_controls block
  // This method attaches javascript function to those tables to trigger other jascript
  // methods in this file when they are clicked.
  setUpControls = function() {
    // All links with titles have the title turned into a tooltip. The tooltip is styled
    // in src/stylesheets/tooltip.css
    $("a[title]").tooltip({ delay: 0, position: 'top left', offset: [3, 3], tip: '#tooltip' });

    // This turns the cells that are labeled '1' '2' '3' '4' into controls that select
    // a new pathway. The cell is expected to have a data-choicenumber attribute that
    // indicates whether it is nuclear, CCS, home heating etc and a data-choicelevel
    // attribute that indicates whether it
    $("a.choiceLink").on('click touchend', function(event) {
      event.preventDefault();
      t = $(event.target);
      c = t.data().choicenumber;
      l = t.data().choicelevel;
      go(c, l);
    });

    $('.choicename').filter( function(){
      return $.inArray($(this).data().choicenumber, [4,5,10,11,17,18,19,25,26,28,33,34,40,41]) === -1;
    }).removeAttr("href").hover(function() {
      $(this).css("cursor","default");
      $(this).css("color", "#000");
    });

    $(".gauge-vertical").mouseover(function() {
      $(".gauge-tooltip").show();
    });

    $(".gauge-vertical").mouseleave(function() {
      $(".gauge-tooltip").hide();
    });

    $(".gauge-horizontal").mouseover(function() {
      $(".gauge-tooltip-h").show();
    });

    $(".gauge-horizontal").mouseleave(function() {
      $(".gauge-tooltip-h").hide();
    });

    $('.lever-step').on('click touchend', function(event) {
      event.preventDefault();
      t = $(event.target);
      l = t.data().choicelevel;
      $(this).parent().children().removeClass('active');
      $(this).addClass('active');
      $(this).parent().find(':nth-child(-n+'+l+')').addClass('active');
    });

    $(".lever-step").on('click touchend', function(event) {
      event.preventDefault();
      t = $(event.target);
      c = t.data().choicenumber;
      l = t.data().choicelevel;
      cArray = c.split(',');
      for (let i = 0; i < cArray.length; i++) {
        go(cArray[i], l);
      }
    });

    $("a.view").on('click touchend', function(event) {
      var t, v;
      event.preventDefault();
      t = $(event.target);
      v = t.data().view;
      return switchView(v);
    });

    $(".newdropdown").on('click touchend', function(event) {
      var d, o, space, t;
      event.preventDefault();
      t = $(event.target);
      d = $(t.data().dropdown);
      if (d.hasClass("showdropdown")) {
        return d.removeClass("showdropdown");
      } else {
        d.addClass("showdropdown");
        o = t.offset();
        o.top = o.top + t.height();
        space = $(document).width() - o.left - d.width();
        if (space < 0) {
          o.left = o.left + space;
        }
        return d.offset(o);
      }
    });

    // This triggers the interface to loop through levels 1 to 4
    // when the user hovers their mouse over a choice.
    d3.selectAll('td.name a')
      .datum(function() { return this.dataset })
      .on('mouseover', function(d,i) { startDemo(d.choicenumber); })
      .on('mouseout', function(d,i) { stopDemo(d.choicenumber); });

    $('#scenarious-dropdown').on('click touchend', function(event){
      event.preventDefault();
      $('.scenarious-sub-menu').toggleClass('sub-menu');
    });

    // $('.scenarious-sub-menu .menu-item').on('click touchend', function(event){
    //   event.preventDefault();
    //   $('.scenarious-sub-menu').toggleClass('sub-menu');
    // });


    $('.current-chart-title').on('click touchend', function(event){
      event.preventDefault();
      $('.mobile-charts-sub-menu').toggleClass('sub-menu');
    });



    $('.show_emissions').on('click touchend', function(event){
      event.preventDefault();

      $('#supply_chart').hide();
      $('#demand_chart').hide();
      $('#emissions_chart').show();

      $('.show_emissions').addClass('chart-selected');
      $('.show_demand').removeClass('chart-selected');
      $('.show_supply').removeClass('chart-selected');

      $('.current-chart-title span').text($(this).text());
      $('.mobile-charts-sub-menu').removeClass('sub-menu');

      $('.mobile-charts-sub-menu .menu-item-supply').show();
      $('.mobile-charts-sub-menu .menu-item-emissions').hide();
      $('.mobile-charts-sub-menu .menu-item-demand').show();
    });

    $('.show_supply').on('click touchend', function(event){
      event.preventDefault();

      $('#supply_chart').show();
      $('#demand_chart').hide();
      $('#emissions_chart').hide();

      $('.show_supply').addClass('chart-selected');
      $('.show_demand').removeClass('chart-selected');
      $('.show_emissions').removeClass('chart-selected');

      $('.current-chart-title span').text($(this).text());
      $('.mobile-charts-sub-menu').removeClass('sub-menu');

      $('.mobile-charts-sub-menu .menu-item-supply').hide();
      $('.mobile-charts-sub-menu .menu-item-emissions').show();
      $('.mobile-charts-sub-menu .menu-item-demand').show();
    });

    $('.show_demand').on('click touchend', function(event){
      event.preventDefault();

      $('#supply_chart').hide();
      $('#demand_chart').show();
      $('#emissions_chart').hide();

      $('.show_demand').addClass('chart-selected');
      $('.show_supply').removeClass('chart-selected');
      $('.show_emissions').removeClass('chart-selected');

      $('.current-chart-title span').text($(this).text());
      $('.mobile-charts-sub-menu').removeClass('sub-menu');

      $('.mobile-charts-sub-menu .menu-item-supply').show();
      $('.mobile-charts-sub-menu .menu-item-emissions').show();
      $('.mobile-charts-sub-menu .menu-item-demand').hide();
    });

    $(".nav-hamburger").on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();
      $(".nav-sidebar").toggleClass("open");
    });

    $(".backdrop, .modal-sections-mask, .modal-how-to-use-mask,"+
      ".modal-calculator-structure-mask, .modal-calculator-scenarious-mask,"+
      " .modal-about-mask, .modal-goals-mask, .modal-tablet-mask, "+
      " .modal-mask").on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();
      $(".calculator-inputs").removeClass("open");
      $('.modal-sectors').hide();
      $('.modal-ambitions').hide();
      $(".backdrop").removeClass("visible");
      //hide-overflow
      $("body").removeClass("hide-overflow");

      // menu
      $('.modal-mask').removeClass("open");
      $('.modal-sections-mask, .modal-how-to-use-mask').hide();
      $('.modal-calculator-structure-mask, .modal-calculator-scenarious-mask').hide();
      $('.modal-about-mask, .modal-goals-mask, .modal-tablet-mask').hide();



    });


    $(".modal-sections-block, .modal-tablet-block, .content-container, .modal-block").on('click touchend', function(event){
      event.stopPropagation();
      // event.preventDefault();
    });

    $(".button-scenarious").on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();
      $(".calculator-inputs").toggleClass("open");
      $(".backdrop").toggleClass("visible");
      $("body").toggleClass("hide-overflow");
    });

    $(".button__results").on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();
      $(".calculator-inputs").toggleClass("open");
      $(".backdrop").toggleClass("visible");
      $("body").toggleClass("hide-overflow");
    });

    $(".close-calculator-controls").on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();
      $(".calculator-inputs").toggleClass("open");
      $(".backdrop").toggleClass("visible");
      $("body").toggleClass("hide-overflow");
    });

    $('.card').on('click touchend', function(event){
      event.preventDefault();
      // $(this).toggleClass("active");
      $(this).parent('.levers-sector').siblings('.levers-subsector-container').toggleClass('open');
      if ($('.levers').find('.open').length > 0) {
        $(".card").addClass("active");
      } else {
        $(".card").removeClass("active");
      }
    });
    // PAGE TABS
    $('.calculator-page').on('click touchend', function(event){
      event.preventDefault();
      // show-hide content
      $('.calculator-wrapper').addClass('active-page');
      $('.how-to-use-wrapper').removeClass('active-page');
      $('.about-page-wrapper').removeClass('active-page');

      // change active tab header
      $(this).addClass('active-tab');
      $('.how-to-use-page').removeClass('active-tab');
      $('.about-project-page').removeClass('active-tab');
    });

    $('.how-to-use-page').on('click touchend', function(event){
      event.preventDefault();

      $('.calculator-wrapper').removeClass('active-page');
      $('.how-to-use-wrapper').addClass('active-page');
      $('.about-page-wrapper').removeClass('active-page');

      $(this).addClass('active-tab');
      $('.calculator-page').removeClass('active-tab');
      $('.about-project-page').removeClass('active-tab');
    });



    $('.about-project-page').on('click touchend', function(event){
      event.preventDefault();

      $('.calculator-wrapper').removeClass('active-page');
      $('.how-to-use-wrapper').removeClass('active-page');
      $('.about-page-wrapper').addClass('active-page');

      $(this).addClass('active-tab');
      $('.calculator-page').removeClass('active-tab');
      $('.how-to-use-page').removeClass('active-tab');
    });

    // $('.column').animate({
    //   height: 38+'%'
    // });

    $('.share_link').on('click touchend', function(event){
        event.preventDefault();
        var dummy = document.createElement('input'),
        text = window.location.href;

        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);

        $('.info-box').show().delay(3000).fadeOut();
    });

    // MODALS
    // $('.calculator-page').on('click touchend', function(event){
    //   event.preventDefault();

    //   $('.modal-how-to-use').hide();
    //   $('.modal-about-project').hide();

    //   $(this).addClass('active-tab');
    //   $('.how-to-use').removeClass('active-tab');
    //   $('.about-project').removeClass('active-tab');
    // });

    $('.mobile-calculator-summary').on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();

      $('.modal-how-to-use').show();

      $('.modal-calculator-structure').hide();
      $('.modal-calculator-scenarious').hide();
      $('.nav-sidebar').removeClass('open');
    });



    $('.mobile-calculator-structure').on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();

      $('.modal-calculator-structure').show();

      $('.modal-calculator-scenarious').hide();
      $('.modal-how-to-use').hide();
      $('.nav-sidebar').removeClass('open');
    });




    $('.mobile-calculator-scenarious').on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();

      $('.modal-calculator-scenarious').show();

      $('.modal-calculator-structure').hide();
      $('.modal-how-to-use').hide();
      $('.nav-sidebar').removeClass('open');
    });




    $('.mobile-project-about').on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();

      $('.modal-project-about').show();
      $('.modal-project-goals').hide();

      $('.nav-sidebar').removeClass('open');
    });


    $('.mobile-project-goals').on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();

      $('.modal-project-goals').show();
      $('.modal-project-about').hide();
      $('.nav-sidebar').removeClass('open');
    });

    $('.show-modal-sectors').on('click touchend', function(event){
      event.preventDefault();

      $('.modal-sectors').show();
    });

    $('.show-modal-ambitions').on('click touchend', function(event){
      event.preventDefault();

      $('.modal-ambitions').show();
    });


    $('.menu-tablet-how-to-use').on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();

      $('.tablet-howto').show();
    });

    $('.menu-tablet-about').on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();

      $('.tablet-about').show();
    });

    $('.close-tablet-howto-sidebar').on('click touchend', function(){
      $('.tablet-howto').hide();
    });

    $('.close-tablet-about-sidebar').on('click touchend', function(){
      $('.tablet-about').hide();
    });






    $('.close-ambitions-sidebar').on('click touchend', function(){
      $('.modal-ambitions').hide();
    });


    $('.close-sectors-sidebar').on('click touchend', function(){
      $('.modal-sectors').hide();
    });


    $('.close-about-sidebar').on('click touchend', function(){
      $('.modal-project-about').hide();
    });

    $('.close-goals-sidebar').on('click touchend', function(){
      $('.modal-project-goals').hide();
    });



    $('.close-structure-sidebar').on('click touchend', function(){
      $('.modal-calculator-structure').hide();
    });


    $('.close-howto-sidebar').on('click touchend', function(){
      $('.modal-how-to-use').hide();
    });

    $('.close-scenarious-sidebar').on('click touchend', function(){
      $('.modal-calculator-scenarious').hide();
    });


    // $('.about-project').on('click touchend', function(event){
    //   event.preventDefault();

    //   // $('.modal-how-to-use').hide();
    //   // $('.modal-about-project').show();
    // });




    $('.modal-close-about-icon').on('click touchend', function(){
      $('.modal-about-project').toggle();
    });

// how to use
    $('.kopsavilkums').on('click touchend', function(event){
      event.preventDefault();

      $(this).addClass('router-link-exact-active router-link-active');
      $('.uzbuve').removeClass('router-link-exact-active router-link-active');
      $('.scenariji').removeClass('router-link-exact-active router-link-active');

      $('.how-to-use').show();
      $('.calc-structure').hide();
      $('.scenarious').hide();
    });

    $('.uzbuve').on('click touchend', function(event){
      event.preventDefault();

      $(this).addClass('router-link-exact-active router-link-active');
      $('.kopsavilkums').removeClass('router-link-exact-active router-link-active');
      $('.scenariji').removeClass('router-link-exact-active router-link-active');

      $('.how-to-use').hide();
      $('.calc-structure').show();
      $('.scenarious').hide();
    });

    $('.scenariji').on('click touchend', function(event){
      event.preventDefault();

      $(this).addClass('router-link-exact-active router-link-active');
      $('.uzbuve').removeClass('router-link-exact-active router-link-active');
      $('.kopsavilkums').removeClass('router-link-exact-active router-link-active');

      $('.how-to-use').hide();
      $('.calc-structure').hide();
      $('.scenarious').show();
    });

// about project
    $('.project').on('click touchend', function(event){
      event.preventDefault();

      $(this).addClass('router-link-exact-active router-link-active');
      $('.goals').removeClass('router-link-exact-active router-link-active');

      $('.about-project').show();
      $('.project-purpose').hide();
    });

    $('.goals').on('click touchend', function(event){
      event.preventDefault();

      $(this).addClass('router-link-exact-active router-link-active');
      $('.project').removeClass('router-link-exact-active router-link-active');

      $('.about-project').hide();
      $('.project-purpose').show();
    });


    // mobile menu

    $('.close-nav-sidebar').on('click touchend', function(event){
      event.stopPropagation();
      event.preventDefault();

      $('.nav-sidebar').removeClass('open');
    });



    // This forces the view to be redrawn if the user resizes their
    // browser window. It uses a timer to only trigger the redraw
    // half a second after the user has stopped resizing.
    // FIXME: The redrawing sometimes appears buggy.
    windowResizeDebounceTimer = null;
    $(window).resize(function(event) {
      clearTimeout(windowResizeDebounceTimer);
      windowResizeDebounceTimer = setTimeout(function() {
        // FIXME: Refactor out the cache[codeForChoices()] call
        active_view.updateResults(cache[codeForChoices()]);
      }, 500);
    });
  };

  setVariablesFromURL = function() {
    var url_elements;
    url_elements = window.location.pathname.split('/');
    controller = url_elements[1] || "pathways";
    choices = choicesForCode(url_elements[2] || twentyfifty.default_pathway);
    view = url_elements[3] || "primary_energy_chart";
    if (view === 'costs_compared_within_sector') {
      sector = url_elements[4];
    }
    if (url_elements[4] === 'comparator') {
      return comparator = url_elements[5];
    }
  };

  selectLevelsButton = function(level) {
    $('.lever-step').removeClass("active");
    $('.lever-step').filter(function(){ return $(this).data().choicelevel <= level}).addClass("active");
  }

  check_level_buttons = function(main_code) {
    const codeArray = [...main_code];
    const transport = codeArray.slice(25, 31);
    const household = codeArray.slice(32, 39);
    const commerce = codeArray.slice(40, 49);
    const bioenergy = codeArray.slice(17, 23);
    const energyprod = codeArray.slice(2, 16);
    // compare transport path of main_code
    // to see if particular level should be set
    // 11111111111111111111111112222221111111111111111111111
    // 11111111111111111111111111111111444414411111111111111
    // 11111111111111111111111111111111111111112212221221111
    // 11111111111111111333333111111111111111111111111111111
    // 11333311133311331111111111111111111111111111111111111
    if (transport.join('') === '111111') {
      setCategoryButtonsToLevel(1, '.lever-step-transport');
    } else if (transport.join('') === '222222') {
      setCategoryButtonsToLevel(2, '.lever-step-transport');
    } else if (transport.join('') === '333333') {
      setCategoryButtonsToLevel(3, '.lever-step-transport');
    } else if (transport.join('') === '444444') {
      setCategoryButtonsToLevel(4, '.lever-step-transport');
    } else {
      setCategoryButtonsToLevel(0, '.lever-step-transport');
    }

    if (household.join('') === '1111111') {
      setCategoryButtonsToLevel(1, '.lever-step-household');
    } else if (household.join('') === '2222122') {
      setCategoryButtonsToLevel(2, '.lever-step-household');
    } else if (household.join('') === '3333133') {
      setCategoryButtonsToLevel(3, '.lever-step-household');
    } else if (household.join('') === '4444144') {
      setCategoryButtonsToLevel(4, '.lever-step-household');
    } else {
      setCategoryButtonsToLevel(0, '.lever-step-household');
    }

    if (commerce.join('') === '111111111') {
      setCategoryButtonsToLevel(1, '.lever-step-commerce');
    } else if (commerce.join('') === '221222122') {
      setCategoryButtonsToLevel(2, '.lever-step-commerce');
    } else if (commerce.join('') === '331333133') {
      setCategoryButtonsToLevel(3, '.lever-step-commerce');
    } else if (commerce.join('') === '441444144') {
      setCategoryButtonsToLevel(4, '.lever-step-commerce');
    } else {
      setCategoryButtonsToLevel(0, '.lever-step-commerce');
    }

    if (bioenergy.join('') === '111111') {
      setCategoryButtonsToLevel(1, '.lever-step-bioenergy');
    } else if (bioenergy.join('') === '222222') {
      setCategoryButtonsToLevel(2, '.lever-step-bioenergy');
    } else if (bioenergy.join('') === '333333') {
      setCategoryButtonsToLevel(3, '.lever-step-bioenergy');
    } else if (bioenergy.join('') === '444444') {
      setCategoryButtonsToLevel(4, '.lever-step-bioenergy');
    } else {
      setCategoryButtonsToLevel(0, '.lever-step-bioenergy');
    }

    if (energyprod.join('') === '11111111111111') {
      setCategoryButtonsToLevel(1, '.lever-step-energy-prod');
    } else if (energyprod.join('') === '22221112221122') {
      setCategoryButtonsToLevel(2, '.lever-step-energy-prod');
    } else if (energyprod.join('') === '33331113331133') {
      setCategoryButtonsToLevel(3, '.lever-step-energy-prod');
    } else if (energyprod.join('') === '44441114441144') {
      setCategoryButtonsToLevel(4, '.lever-step-energy-prod');
    } else {
      setCategoryButtonsToLevel(0, '.lever-step-energy-prod');
    }

  }

  setCategoryButtonsToLevel = function(level, category) {
    if (level !== 0) {
      $(category).removeClass("active");
      $(category).filter(function(){ return $(this).data().choicelevel <= level}).addClass("active");
    } else {
      $(category).removeClass("active");
    }
  }

  float_to_letter_map = {
    "": "0",
    1.0: "1",
    1.1: "b",
    1.2: "c",
    1.3: "d",
    1.4: "e",
    1.5: "f",
    1.6: "g",
    1.7: "h",
    1.8: "i",
    1.9: "j",
    2.0: "2",
    2.1: "l",
    2.2: "m",
    2.3: "n",
    2.4: "o",
    2.5: "p",
    2.6: "q",
    2.7: "r",
    2.8: "s",
    2.9: "t",
    3.0: "3",
    3.1: "v",
    3.2: "w",
    3.3: "x",
    3.4: "y",
    3.5: "z",
    3.6: "A",
    3.7: "B",
    3.8: "C",
    3.9: "D",
    0.0: "0",
    4.0: "4"
  };

  codeForChoices = function(c) {
    var cd, choice;
    if (c == null) {
      c = choices;
    }
    cd = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = c.length; _i < _len; _i++) {
        choice = c[_i];
        _results.push(float_to_letter_map[choice]);
      }
      return _results;
    })();
    return cd.join('');
  };

  letter_to_float_map = {
    "1": 1.0,
    "b": 1.1,
    "c": 1.2,
    "d": 1.3,
    "e": 1.4,
    "f": 1.5,
    "g": 1.6,
    "h": 1.7,
    "i": 1.8,
    "j": 1.9,
    "2": 2.0,
    "l": 2.1,
    "m": 2.2,
    "n": 2.3,
    "o": 2.4,
    "p": 2.5,
    "q": 2.6,
    "r": 2.7,
    "s": 2.8,
    "t": 2.9,
    "3": 3.0,
    "v": 3.1,
    "w": 3.2,
    "x": 3.3,
    "y": 3.4,
    "z": 3.5,
    "A": 3.6,
    "B": 3.7,
    "C": 3.8,
    "D": 3.9,
    "0": 0.0,
    "4": 4.0
  };

  choicesForCode = function(newCode) {
    var choice, _i, _len, _ref, _results;
    _ref = newCode.split('');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      choice = _ref[_i];
      _results.push(letter_to_float_map[choice]);
    }
    return _results;
  };

  url = function(options) {
    var s;
    if (options == null) {
      options = {};
    }
    s = jQuery.extend({
      controller: controller,
      code: codeForChoices(),
      view: view,
      sector: sector,
      comparator: getComparator()
    }, options);
    if (s.view === 'costs_compared_within_sector' && (s.sector != null)) {
      return "/" + s.controller + "/" + s.code + "/" + s.view + "/" + s.sector;
    } else if (s.comparator != null) {
      return "/" + s.controller + "/" + s.code + "/" + s.view + "/comparator/" + s.comparator;
    } else {
      return "/" + s.controller + "/" + s.code + "/" + s.view;
    }
  };

  go = function(index, level) {
    old_choices = choices.slice(0);
    if (index <= 15 && index !== 3 && level > 1 && Math.ceil(choices[index]) === level) {
      choices[index] = Math.round((choices[index] - 0.1) * 10) / 10;
    } else {
      choices[index] = level;
    }
    return loadMainPathway();
  };

  demoTimer = null;

  demoOriginalLevel = null;

  startDemo = function(choice) {
    var demoLevel, demoMaximum;
    demoLevel = 1;
    demoOriginalLevel = choices[choice];
    demoMaximum = window.twentyfifty.choice_sizes[choice];
    return demoTimer = setInterval((function() {
      go(choice, demoLevel);
      demoLevel = demoLevel + 1;
      if (demoLevel > demoMaximum) {
        demoLevel = 1;
      }
      return false;
    }), 1000);
  };

  stopDemo = function(choice) {
    if (demoTimer != null) {
      clearInterval(demoTimer);
    }
    if ((demoOriginalLevel != null) && demoOriginalLevel !== choices[choice]) {
      return go(choice, demoOriginalLevel);
    }
  };

  switchView = function(new_view) {
    var c, data;
    $('.showdropdown').removeClass("showdropdown");
    if (view === new_view && (active_view != null)) {
      return false;
    }
    if (active_view != null) {
      active_view.teardown();
    }
    view = new_view;
    active_view = views[view];
    $("a.selectedView").removeClass("selectedView");
    $("a.view[data-view='" + view + "']").addClass("selectedView");
    if (view === "costs_in_context") {
      $("#cost_choice").addClass("selectedView").text("Costs: context");
    } else if (view === "costs_compared_overview") {
      $("#cost_choice").addClass("selectedView").text("Costs: compared");
    } else if (view === "costs_sensitivity") {
      $("#cost_choice").addClass("selectedView").text("Costs: sensitivity");
    } else {
      $("#cost_choice").text("Costs");
    }
    active_view.setup();
    c = codeForChoices();
    data = cache[c];
    if (data != null) {
      active_view.updateResults(data);
    }

    if(active_view.updateComparator != undefined) {
      updateComparator();
    }

    if (history['pushState'] != null) {
      return history.pushState(choices, c, url());
    }
  };

  switchPathway = function(new_code) {
    return setChoices(choicesForCode(new_code));
  };

  setChoices = function(new_choices) {
    $('.showdropdown').removeClass("showdropdown");
    old_choices = choices.slice(0);
    choices = new_choices;
    return loadMainPathway();
  };

  loadMainPathway = function(pushState) {
    var fetch, main_code;
    if (pushState == null) {
      pushState = true;
    }
    if (choices.join('') === old_choices.join('')) {
      return false;
    }
    updateControls(old_choices, choices);
    main_code = codeForChoices();
    check_level_buttons(main_code);
    if (history['pushState'] != null) {
      history.pushState(choices, main_code, url());
    }
    if (cache[main_code] != null) {
      active_view.updateResults(cache[main_code]);
      return $('#calculating').hide();
    } else {
      $('#calculating').show();
      fetch = function() {
        return $.getJSON(url({
          code: main_code,
          view: 'data',
          sector: null,
          comparator: null
        }), function(data) {
          if (data != null) {
            cache[data._id] = data;
            if (data._id === codeForChoices()) {
              active_view.updateResults(data);
              return $('#calculating').hide();
            }
          }
        });
      };
      return fetch();
    }
  };

  loadSecondaryPathway = function(secondary_code, callback) {
    var fetch;
    if (cache[secondary_code] != null) {
      return callback(cache[secondary_code]);
    } else {
      fetch = (function(_this) {
        return function() {
          return $.getJSON(url({
            code: secondary_code,
            view: 'data',
            sector: null,
            comparator: null
          }), function(data) {
            if (data != null) {
              cache[data._id] = data;
              return callback(data);
            }
          });
        };
      })(this);
      return fetch();
    }
  };

  window.onpopstate = function(event) {
    var url_elements;
    if (!event.state) {
      return false;
    }
    url_elements = window.location.pathname.split('/');
    setChoices(choicesForCode(url_elements[2]));
    switchView(url_elements[3]);
    if (view === 'costs_compared_within_sector') {
      switchSector(url_elements[4]);
    }
    if (url_elements[4] === 'comparator') {
      return switchComparator(url_elements[5]);
    }
  };

  updateControls = function(old_choices, choices) {
    var c, choice, choice_frview, choice_whole, controls, i, old_choice, old_choice_frview, old_choice_whole, row, _i, _j, _len, _ref, _ref1, _results;
    this.choices = choices;
    controls = $('#classic_controls');
    _ref = this.choices;
    _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      choice = _ref[i];
      old_choice = old_choices[i];
      if (choice !== old_choices[i]) {
        old_choice_whole = Math.ceil(old_choice);
        old_choice_frview = parseInt((old_choice % 1) * 10);
        choice_whole = Math.ceil(choice);
        choice_frview = parseInt((choice % 1) * 10);
        row = controls.find("tr#r" + i);
        row.find(".selected, .level" + old_choice_whole + ", .level" + old_choice_whole + "_" + old_choice_frview).removeClass("selected level" + old_choice_whole + " level" + old_choice_whole + "_" + old_choice_frview);
        if (old_choice_frview !== 0) {
          controls.find("#c" + i + "l" + old_choice_whole).text(old_choice_whole);
        }
        row.find("#c" + i + "l" + choice_whole).addClass('selected');
        for (c = _j = 1, _ref1 = choice_whole - 1; 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; c = 1 <= _ref1 ? ++_j : --_j) {
          controls.find("#c" + i + "l" + c).addClass("level" + choice_whole);
        }
        if (choice_frview !== 0) {
          controls.find("#c" + i + "l" + choice_whole).text(choice);
          _results.push(controls.find("#c" + i + "l" + choice_whole).addClass("level" + choice_whole + "_" + choice_frview));
        } else {
          _results.push(controls.find("#c" + i + "l" + choice_whole).addClass("level" + choice_whole));
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  getSector = function() {
    return parseInt(sector);
  };

  switchSector = function(new_sector) {
    sector = new_sector;
    if (history['pushState'] != null) {
      history.pushState(choices, codeForChoices(), url());
    }
    switchView('costs_compared_within_sector');
    active_view.teardown();
    return active_view.updateResults(cache[codeForChoices()]);
  };

  getComparator = function() {
    return comparator || twentyfifty.default_comparator_code;
  };

  updateComparator = function() {
    loadSecondaryPathway(getComparator(), function(comparator) {
      active_view.updateComparator(comparator);
    });
  }

  switchComparator = function(new_comparator) {
    comparator = new_comparator;
    if (history['pushState'] != null) {
      history.pushState(choices, codeForChoices(), url());
    }
    updateComparator();
  };

  pathwayName = function(pathway_code, default_name) {
    if (default_name == null) {
      default_name = null;
    }
    return window.twentyfifty.pathway_names_hash[pathway_code] || default_name;
  };

  pathwayDescriptions = function(pathway_code, default_description) {
    if (default_description == null) {
      default_description = null;
    }
    return window.twentyfifty.pathway_descriptions_hash[pathway_code] || default_description;
  };

  pathwayWikiPages = function(pathway_code, default_page) {
    if (default_page == null) {
      default_page = null;
    }
    return "http://2050-calculator-tool-wiki.decc.gov.uk/pages/" + (window.twentyfifty.pathway_wiki_pages_hash[pathway_code] || default_page);
  };

  getChoices = function() {
    return choices;
  };

  showCorrectPage = function() {
    if (window.innerWidth < 1281) {
      // reset active page/tab to calculator and
      $('.calculator-wrapper').addClass('active-page');
      $('.how-to-use-wrapper').removeClass('active-page');
      $('.about-page-wrapper').removeClass('active-page');

      // change active tab to calc and
      $('.calculator-page').addClass('active-tab');
      $('.how-to-use-page').removeClass('active-tab');
      $('.about-project-page').removeClass('active-tab');

    }

    if (window.innerWidth > 1280) {
      $('.nav-sidebar').removeClass('open');
      $(".calculator-inputs").removeClass("open");
      $(".backdrop").removeClass("visible");

      $('.modal-how-to-use').hide();
      $('.modal-calculator-structure').hide();
      $('.modal-calculator-scenarious').hide();

      $('.modal-project-about').hide();
      $('.modal-project-goals').hide();
    }
  }

  window.twentyfifty.code = codeForChoices;

  window.twentyfifty.getChoices = getChoices;

  window.twentyfifty.setChoices = setChoices;

  window.twentyfifty.getSector = getSector;

  window.twentyfifty.switchSector = switchSector;

  window.twentyfifty.getComparator = getComparator;

  window.twentyfifty.switchComparator = switchComparator;

  window.twentyfifty.url = url;

  window.twentyfifty.loadMainPathway = loadMainPathway;

  window.twentyfifty.loadSecondaryPathway = loadSecondaryPathway;

  window.twentyfifty.switchView = switchView;

  window.twentyfifty.switchPathway = switchPathway;

  window.twentyfifty.pathwayName = pathwayName;

  window.twentyfifty.pathwayDescriptions = pathwayDescriptions;

  window.twentyfifty.pathwayWikiPages = pathwayWikiPages;

  window.twentyfifty.startDemo = startDemo;

  window.twentyfifty.stopDemo = stopDemo;

  window.twentyfifty.views = views;

  window.onresize = showCorrectPage;

}).call(this);
