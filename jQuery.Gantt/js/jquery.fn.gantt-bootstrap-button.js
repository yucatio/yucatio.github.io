/**
 * jQuery Gantt Chart
 *
 * @see http://taitems.github.io/jQuery.Gantt/
 * @license MIT
 */
/*jshint camelcase:true, freeze:true, jquery:true */
(function ($, undefined) {
    "use strict";

    var UTC_DAY_IN_MS = 24 * 60 * 60 * 1000;

    // Date prototype helpers
    // ======================

    // `getWeekId` returns a string in the form of 'dh-YYYY-WW', where WW is
    // the week # for the year.
    // It is used to add an id to the week divs
    Date.prototype.getWeekId = function () {
        var y = this.getFullYear();
        var w = this.getWeekOfYear();
        var m = this.getMonth();
        if (m === 11 && w === 1) {
            y++;
        } else if (!m && w > 51) {
            y--;
        }
        return y + "-" + w;
    };

    // `getRepDate` returns the milliseconds since the epoch for a given date
    // depending on the active scale
    Date.prototype.getRepDate = function (scaleGroup) {
        switch (scaleGroup) {
        case "weeks":
            return this.getDayForWeek().getTime();
        case "months":
            return new Date(this.getFullYear(), this.getMonth(), 1).getTime();
        case "hours":
            /* falls through */
        case "days":
            /* falls through */
        default:
            return this.getTime();
        }
    };

    // `getDayOfYear` returns the day number for the year
    Date.prototype.getDayOfYear = function () {
        var year = this.getFullYear();
        return (Date.UTC(year, this.getMonth(), this.getDate()) -
                Date.UTC(year, 0, 0)) / UTC_DAY_IN_MS;
    };

    // Use ISO week by default
    //TODO: make these options.
    var firstDay = 1; // ISO week starts with Monday (1); use Sunday (0) for, e.g., North America
    var weekOneDate = 4; // ISO week one always contains 4 Jan; use 1 Jan for, e.g., North America

    // `getWeekOfYear` returns the week number for the year
    //TODO: fix bug when firstDay=6/weekOneDate=1 : https://github.com/moment/moment/issues/2115
    Date.prototype.getWeekOfYear = function () {
        var year = this.getFullYear(),
            month = this.getMonth(),
            date = this.getDate(),
            day = this.getDay();
        //var diff = weekOneDate - day + 7 * (day < firstDay ? -1 : 1);
        var diff = weekOneDate - day;
        if (day < firstDay) {
            diff -= 7;
        }
        if (diff + 7 < weekOneDate - firstDay) {
            diff += 7;
        }
        return Math.ceil(new Date(year, month, date + diff).getDayOfYear() / 7);
    };

    // `getDayForWeek` returns the first day of this Date's week
    Date.prototype.getDayForWeek = function () {
        var day = this.getDay();
        var diff = (day < firstDay ? -7 : 0) + firstDay - day;
        return new Date( this.getFullYear(), this.getMonth(), this.getDate() + diff );
    };

    // fixes https://github.com/taitems/jQuery.Gantt/issues/62
    function ktkGetNextDate(currentDate, scaleStep) {
        for(var minIncrements = 1;; minIncrements++) {
            var nextDate = new Date(currentDate);
            nextDate.setHours(currentDate.getHours() + scaleStep * minIncrements);

            if (nextDate.getTime() !== currentDate.getTime()) {
                return nextDate;
            }

            // If code reaches here, it's because current didn't really increment (invalid local time) because of daylight-saving adjustments
            // => retry adding 2, 3, 4 hours, and so on (until nextDate > current)
        }
    }

    $.fn.gantt = function (options) {

        var scales = ["hours", "hours3", "hours6", "hours12", "days", "weeks", "months"];
        var scaleSettings = {
            "hours": {scaleGroup: "hours", scaleStep: 1},
            "hours3": {scaleGroup: "hours", scaleStep: 3},
            "hours6": {scaleGroup: "hours", scaleStep: 6},
            "hours12": {scaleGroup: "hours", scaleStep: 12},
            "days": {scaleGroup: "days", scaleStep: 1},
            "weeks": {scaleGroup: "weeks", scaleStep: 1},
            "months": {scaleGroup: "months", scaleStep: 1},
        };

        var scaleGroupSttings = {
            "hours": {headerRows: 5, cellStep : 60 * 60 * 1000},
            "days": {headerRows: 4, cellStep : 24 * 60 * 60 * 1000},
            "weeks": {headerRows: 3, cellStep : 7 * 24 * 60 * 60 * 1000},
            "months": {headerRows: 2},
        };

        //Default settings
        var settings = {
            source: [],
            holidays: [],
            // paging
            itemsPerPage: 7,
            itemsPerPageSelect: [],
            // localisation
            dow: ["S", "M", "T", "W", "T", "F", "S"],
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            waitText: "Please wait...",
            // navigation
            navigate: "buttons",
            navigationPosition : "bottom",
            scrollToToday: true,
            // cookie options
            useCookie: false,
            cookieKey: "jquery.fn.gantt",
            // scale parameters
            scale: "days",
            maxScale: "months",
            minScale: "hours",
            // callbacks
            onItemClick: function (data) { return; },
            onAddClick: function (dt, rowId) { return; },
            onRender: $.noop,
            // extensions
            highlightRow : true,
            snapToGrid : true
        };

        // read options
        $.extend(settings, options);

        settings.scale = ($.inArray(settings.scale, scales) >= 0) ? settings.scale : "days";
        settings.maxScale = ($.inArray(settings.maxScale, scales) >= 0) ? settings.maxScale : scales[scales.length - 1];
        settings.minScale = ($.inArray(settings.minScale, scales) >= 0) ? settings.minScale : scales[0];

        settings.maxScale = ($.inArray(settings.scale, scales) <= $.inArray(settings.maxScale, scales) ? settings.maxScale : settings.scale); 
        settings.minScale = ($.inArray(settings.scale, scales) >= $.inArray(settings.minScale, scales) ? settings.minScale : settings.scale); 

        // can't use cookie if don't have `$.cookie`
        settings.useCookie = settings.useCookie && $.isFunction($.cookie);

        // Grid management
        // ===============

        // Core object is responsible for navigation and rendering
        var core = {
            // Return the element whose topmost point lies under the given point
            // Normalizes for old browsers (NOTE: doesn't work when element is outside viewport)
            //TODO: https://github.com/taitems/jQuery.Gantt/issues/137
            elementFromPoint: (function(){ // IIFE
                // version for normal browsers
                if (document.compatMode === "CSS1Compat") {
                    return function (x, y) {
                        x -= window.pageXOffset;
                        y -= window.pageYOffset;
                        return document.elementFromPoint(x, y);
                    };
                }
                // version for older browsers
                return function (x, y) {
                    x -= $(document).scrollLeft();
                    y -= $(document).scrollTop();
                    return document.elementFromPoint(x, y);
                };
            })(),

            // **Create the chart**
            create: function (element) {

                // Initialize data with a json object or fetch via an xhr
                // request depending on `settings.source`
                if (typeof settings.source !== "string") {
                    element.data = settings.source;
                    core.init(element);
                } else {
                    $.getJSON(settings.source, function (jsData) {
                        element.data = jsData;
                        core.init(element);
                    });
                }
            },

            // **Setup the initial view**
            // Here we calculate the number of rows, pages and visible start
            // and end dates once the data are ready
            init: function (element) {
                element.rowsNum = element.data.length;
                element.pageCount = Math.ceil(element.rowsNum / settings.itemsPerPage);
                element.rowsOnLastPage = element.rowsNum - (Math.floor(element.rowsNum / settings.itemsPerPage) * settings.itemsPerPage);

                element.dateStart = tools.getMinDate(element);
                element.dateEnd = tools.getMaxDate(element);


                /* core.render(element); */
                core.waitToggle(element, function () { core.render(element); });
            },

            // **Render the grid**
            render: function (element) {
                var content = $('<div class="fn-content"/>');
                var $leftPanel = core.leftPanel(element);
                content.append($leftPanel);
                var $rightPanel = core.rightPanel(element, $leftPanel);
                var mLeft, hPos;

                content.append($rightPanel);

                if (settings.navigationPosition === "top") {
                    content.prepend(core.navigation(element));
                } else {
                    content.append(core.navigation(element));
                }
                var $dataPanel = $rightPanel.find(".dataPanel");

                element.gantt = $('<div class="fn-gantt" />').append(content);

                $(element).empty().append(element.gantt);

                element.scrollNavigation.panelMaxPos = ($dataPanel.width() - $rightPanel.width()) * -1;
                element.scrollNavigation.canScroll = ($dataPanel.width() > $rightPanel.width());

                core.markNow(element);
                core.fillData(element, $dataPanel, $leftPanel);

                if (element.highlightedRow !== null) {
                    core.highlightRow(element, element.highlightedRow);
                }

                // Set a cookie to record current position in the view
                if (settings.useCookie) {
                    var sc = $.cookie(settings.cookieKey + "ScrollPos");
                    if (sc) {
                        element.hPosition = sc;
                    }
                }

                // Scroll the grid to today's date
                if (settings.scrollToToday) {
                    core.navigateTo(element, 'now');
                    core.scrollPanel(element, 0);
                    settings.scrollToToday = false;
                // or, scroll the grid to the left most date in the panel
                } else {
                    if (element.hPosition !== 0) {
                        if (element.scaleOldWidth) {
                            mLeft = ($dataPanel.width() - $rightPanel.width());
                            hPos = mLeft * element.hPosition / element.scaleOldWidth;
                            element.hPosition = hPos > 0 ? 0 : hPos;
                            element.scaleOldWidth = null;
                        }
                        $dataPanel.css({ "margin-left": element.hPosition });
                        element.scrollNavigation.panelMargin = element.hPosition;
                        core.synchronizeScroller(element);
                    }
                    core.repositionLabel(element);
                }

                core.switchScrollButton(element);

                $dataPanel.css({ height: $leftPanel.height() });
                core.waitToggle(element);
                settings.onRender();
            },

            // Create and return the left panel with labels
            leftPanel: function (element) {
                /* Left panel */
                var headerRows = scaleGroupSttings[element.scaleGroup].headerRows;
                var ganttLeftPanel = $('<div class="leftPanel"/>')
                    .append($('<div class="row spacer"/>')
                    .css("height", tools.getCellSize() * headerRows)
                    .css("width", "100%"));

                $.each(element.data, function (i, entry) {
                    if (i >= element.pageNum * settings.itemsPerPage &&
                        i < (element.pageNum * settings.itemsPerPage + settings.itemsPerPage)) {

                        var nameRow = $('<div>').addClass('row name').addClass('row' + i).addClass(entry.desc ? '' : 'fn-wide')
                            .attr('id', 'rowheader' + i).data('offset', i % settings.itemsPerPage * tools.getCellSize()).data('id', entry.id)
                            .append(
                                $('<span>').addClass('fn-label').addClass(entry.cssClass ? entry.cssClass : '').text(entry.name || '')
                            );

                        core.setRowClick(element, nameRow, i);

                        ganttLeftPanel.append(nameRow);

                        if (entry.desc) {
                            var descRow = $('<div>').addClass('row desc').addClass('row' + i).attr('id', 'RowdId_' + i).data('id', entry.id)
                                .append(
                                     $('<span>').addClass('fn-label').addClass(entry.cssClass ? entry.cssClass : '').text(entry.desc)
                                );
                            core.setRowClick(element, descRow, i);

                            ganttLeftPanel.append(descRow);
                        }

                    }
                });
                return ganttLeftPanel;
            },

            // Create and return the data panel element
            dataPanel: function (element, width) {
                var dataPanel = $('<div class="dataPanel" style="width: ' + width + 'px;"/>');

                // Handle mousewheel events for scrolling the data panel
                var wheel = 'onwheel' in element ?
                    'wheel' : document.onmousewheel !== undefined ?
                    'mousewheel' : 'DOMMouseScroll';
                $(element).on(wheel, function (e) { core.wheelScroll(element, e); });

                // Handle click events and dispatch to registered `onAddClick` function
                dataPanel.click(function (e) {

                    e.stopPropagation();
                    var corrX/* <- never used? */, corrY;
                    var leftpanel = $(element).find(".fn-gantt .leftPanel");
                    var datapanel = $(element).find(".fn-gantt .dataPanel");

                    corrY = tools.getCellSize() * (scaleGroupSttings[element.scaleGroup].headerRows -1);

                    /* Adjust, so get middle of elm
                    corrY -= Math.floor(tools.getCellSize() / 2);
                    */

                    // Find column where click occurred
                    var col = core.elementFromPoint(e.pageX, datapanel.offset().top + corrY);
                    // Was the label clicked directly?
                    if (col.className === "fn-label") {
                        col = $(col.parentNode);
                    } else {
                        col = $(col);
                    }

                    var dt = col.data("repdate");
                    // Find row where click occurred
                    var row = core.elementFromPoint(leftpanel.offset().left + leftpanel.width() - 10, e.pageY);
                    // Was the label clicked directly?
                    if (row.className.indexOf("fn-label") === 0) {
                        row = $(row.parentNode);
                    } else {
                        row = $(row);
                    }
                    var rowId = row.data('id');

                    // Dispatch user registered function with the DateTime in ms
                    // and the id if the clicked object is a row
                    settings.onAddClick(dt, rowId);
                });
                return dataPanel;
            },

            // Creates and return the right panel containing the year/week/day header
            rightPanel: function (element, leftPanel /* <- never used? */) {
                var range = null;
                // Days of the week have a class of one of
                // `sn` (Sunday), `sa` (Saturday), or `wd` (Weekday)
                var dowClass = ["sn", "wd", "wd", "wd", "wd", "wd", "sa"];
                //unused: was someone planning to allow styles to stretch to the bottom of the chart?
                //var gridDowClass = [" sn", "", "", "", "", "", " sa"];

                var yearArr = [];
                var scaleUnitsThisYear = 0;

                var monthArr = [];
                var scaleUnitsThisMonth = 0;

                var dayArr = [];
                var hoursInDay = 0;

                var dowArr = [];
                var horArr = [];

                var today = new Date();
                today.setHours(0, 0, 0, 0);

                // reused variables
                var $row = $('<div class="row header"></div>');
                var i, len;
                var year, month, week, day;
                var rday, dayClass;
                var dataPanel;

                // Setup the headings based on scaleGroup
                switch (element.scaleGroup) {
                // **Hours**
                case "hours":
                    var scaleStep = scaleSettings[settings.scale].scaleStep;
                    range = tools.parseTimeRange(element.dateStart, element.dateEnd, scaleStep);

                    year = range[0].getFullYear();
                    month = range[0].getMonth();
                    day = range[0];

                    for (i = 0, len = range.length; i < len; i++) {
                        rday = range[i];

                        // Fill years
                        var rfy = rday.getFullYear();
                        if (rfy !== year) {
                            yearArr.push(
                                '<div class="row header year" style="width: ' +
                                tools.getCellSize() * scaleUnitsThisYear +
                                'px;"><div class="fn-label">' +
                                year +
                                '</div></div>');

                            year = rfy;
                            scaleUnitsThisYear = 0;
                        }
                        scaleUnitsThisYear++;


                        // Fill months
                        var rm = rday.getMonth();
                        if (rm !== month) {
                            monthArr.push(
                                '<div class="row header month" style="width: ' +
                                tools.getCellSize() * scaleUnitsThisMonth + 'px"><div class="fn-label">' +
                                settings.months[month] +
                                '</div></div>');

                            month = rm;
                            scaleUnitsThisMonth = 0;
                        }
                        scaleUnitsThisMonth++;

                        // Fill days & hours
                        var rgetDay = rday.getDay();
                        var getDay = day.getDay();
                        if (rgetDay !== getDay) {
                            dayClass = (today - day === 0) ?
                                "today" : tools.isHoliday( day.getTime() ) ?
                                "holiday" : dowClass[getDay];

                            dayArr.push(
                                '<div class="row date ' + dayClass + '" ' +
                                'style="width: ' + tools.getCellSize() * hoursInDay + 'px;">' +
                                '<div class="fn-label">' + day.getDate() + '</div></div>');
                            dowArr.push(
                                '<div class="row day ' + dayClass + '" ' +
                                'style="width: ' + tools.getCellSize() * hoursInDay + 'px;">' +
                                '<div class="fn-label">' + settings.dow[getDay] + '</div></div>');

                            day = rday;
                            hoursInDay = 0;
                        }
                        hoursInDay++;

                        dayClass = dowClass[rgetDay];
                        if (tools.isHoliday(rday)) {
                            dayClass = "holiday";
                        }
                        horArr.push(
                            '<div class="row day ' +
                            dayClass +
                            '" id="dh-' +
                            rday.getTime() +
                            '" data-offset="' + i * tools.getCellSize() +
                            '" data-repdate="' + rday.getRepDate(element.scaleGroup) +
                            '"><div class="fn-label">' +
                            rday.getHours() +
                            '</div></div>');
                    }

                    // Last year
                    yearArr.push(
                        '<div class="row header year" style="width: ' +
                        tools.getCellSize() * scaleUnitsThisYear + 'px;"><div class="fn-label">' +
                        year +
                        '</div></div>');

                    // Last month
                    monthArr.push(
                        '<div class="row header month" style="width: ' +
                        tools.getCellSize() * scaleUnitsThisMonth + 'px"><div class="fn-label">' +
                        settings.months[month] +
                        '</div></div>');

                    dayClass = dowClass[day.getDay()];

                    if ( tools.isHoliday(day) ) {
                        dayClass = "holiday";
                    }

                    dayArr.push(
                        '<div class="row date ' + dayClass + '" ' +
                        'style="width: ' + tools.getCellSize() * hoursInDay + 'px;">' +
                        '<div class="fn-label">' + day.getDate() + '</div></div>');

                    dowArr.push(
                        '<div class="row day ' + dayClass + '" ' +
                        'style="width: ' + tools.getCellSize() * hoursInDay + 'px;">' +
                        '<div class="fn-label">' + settings.dow[day.getDay()] + '</div></div>');

                    dataPanel = core.dataPanel(element, range.length * tools.getCellSize());

                    // Append panel elements
                    dataPanel.append(
                        $row.clone().html(yearArr.join("")),
                        $row.clone().html(monthArr.join("")),
                        $row.clone().html(dayArr.join("")),
                        $row.clone().html(dowArr.join("")),
                        $row.clone().html(horArr.join(""))
                    );
                    break;

                // **Weeks**
                case "weeks":
                    range = tools.parseWeeksRange(element.dateStart, element.dateEnd);
                    year = range[0].getFullYear();
                    month = range[0].getMonth();
                    week = range[0].getWeekOfYear();
                    var diff;

                    for (i = 0, len = range.length; i < len; i++) {
                        rday = range[i];

                        // Fill years
                        if (week > (week = rday.getWeekOfYear())) {
                            // partial weeks to subtract from year header
                            diff = rday.getDate() - 1;
                            // offset one month (December) if week starts in last year
                            diff -= !rday.getMonth() ? 0 : 31;
                            diff /= 7;
                            yearArr.push(
                                '<div class="row header year" style="width: ' +
                                tools.getCellSize() * (scaleUnitsThisYear - diff) +
                                'px;"><div class="fn-label">' +
                                year +
                                '</div></div>');
                            year++;
                            scaleUnitsThisYear = diff;
                        }
                        scaleUnitsThisYear++;

                        // Fill months
                        if (rday.getMonth() !== month) {
                            // partial weeks to subtract from month header
                            diff = rday.getDate() - 1;
                            // offset one week if week starts in last month
                            //diff -= (diff <= 6) ? 0 : 7;
                            diff /= 7;
                            monthArr.push(
                                '<div class="row header month" style="width:' +
                                tools.getCellSize() * (scaleUnitsThisMonth - diff) +
                                'px;"><div class="fn-label">' +
                                settings.months[month] +
                                '</div></div>');
                            month = rday.getMonth();
                            scaleUnitsThisMonth = diff;
                        }
                        scaleUnitsThisMonth++;

                        // Fill weeks
                        dayArr.push(
                            '<div class="row day wd"' +
                            ' id="dh-' + rday.getWeekId() +
                            '" data-offset="' + i * tools.getCellSize() +
                            '" data-repdate="' + rday.getRepDate(element.scaleGroup) + '">' +
                            '<div class="fn-label">' + week + '</div></div>');
                    }

                    // Last year
                    yearArr.push(
                        '<div class="row header year" style="width: ' +
                        tools.getCellSize() * scaleUnitsThisYear + 'px;"><div class="fn-label">' +
                        year +
                        '</div></div>');

                    // Last month
                    monthArr.push(
                        '<div class="row header month" style="width: ' +
                        tools.getCellSize() * scaleUnitsThisMonth + 'px"><div class="fn-label">' +
                        settings.months[month] +
                        '</div></div>');

                    dataPanel = core.dataPanel(element, range.length * tools.getCellSize());

                    // Append panel elements
                    dataPanel.append(
                        $row.clone().html(yearArr.join("")),
                        $row.clone().html(monthArr.join("")),
                        $row.clone().html(dayArr.join(""))
                    );
                    break;

                // **Months**
                case 'months':
                    range = tools.parseMonthsRange(element.dateStart, element.dateEnd);

                    year = range[0].getFullYear();
                    month = range[0].getMonth();

                    for (i = 0, len = range.length; i < len; i++) {
                        rday = range[i];

                        // Fill years
                        if (rday.getFullYear() !== year) {
                            yearArr.push(
                                '<div class="row header year" style="width: ' +
                                tools.getCellSize() * scaleUnitsThisYear +
                                'px;"><div class="fn-label">' +
                                year +
                                '</div></div>');
                            year = rday.getFullYear();
                            scaleUnitsThisYear = 0;
                        }
                        scaleUnitsThisYear++;
                        monthArr.push(
                            '<div class="row day wd" id="dh-' + tools.genId(rday) +
                            '" data-offset="' + i * tools.getCellSize() +
                            '" data-repdate="' + rday.getRepDate(element.scaleGroup) + '">' +
                            (1 + rday.getMonth()) + '</div>');
                    }

                    // Last year
                    yearArr.push(
                        '<div class="row header year" style="width: ' +
                        tools.getCellSize() * scaleUnitsThisYear + 'px;"><div class="fn-label">' +
                        year +
                        '</div></div>');

                    // Last month
                    monthArr.push(
                        '<div class="row header month" style="width: ' +
                        tools.getCellSize() * scaleUnitsThisMonth + 'px"><div class="fn-label">' +
                        settings.months[month] +
                        '</div></div>');

                    dataPanel = core.dataPanel(element, range.length * tools.getCellSize());

                    // Append panel elements
                    dataPanel.append(
                        $row.clone().html(yearArr.join("")),
                        $row.clone().html(monthArr.join("")),
                        $row.clone().html(dayArr.join("")),
                        $row.clone().html(dowArr.join(""))
                    );
                    break;

                // **Days (default)**
                default:
                    range = tools.parseDateRange(element.dateStart, element.dateEnd);

                    var dateBefore = ktkGetNextDate(range[0], -1);
                    year = dateBefore.getFullYear();
                    month = dateBefore.getMonth();
                    //day = dateBefore; // <- never used?

                    for (i = 0, len = range.length; i < len; i++) {
                        rday = range[i];

                        // Fill years
                        if (rday.getFullYear() !== year) {
                            yearArr.push(
                                '<div class="row header year" style="width:' +
                                tools.getCellSize() * scaleUnitsThisYear +
                                'px;"><div class="fn-label">' +
                                year +
                                '</div></div>');
                            year = rday.getFullYear();
                            scaleUnitsThisYear = 0;
                        }
                        scaleUnitsThisYear++;

                        // Fill months
                        if (rday.getMonth() !== month) {
                            monthArr.push(
                                '<div class="row header month" style="width:' +
                                tools.getCellSize() * scaleUnitsThisMonth +
                                'px;"><div class="fn-label">' +
                                settings.months[month] +
                                '</div></div>');
                            month = rday.getMonth();
                            scaleUnitsThisMonth = 0;
                        }
                        scaleUnitsThisMonth++;

                        day = rday.getDay();
                        dayClass = dowClass[day];
                        if ( tools.isHoliday(rday) ) {
                            dayClass = "holiday";
                        }

                        dayArr.push(
                            '<div class="row date ' + dayClass + '"' +
                            ' id="dh-' + tools.genId(rday) +
                            '" data-offset="' + i * tools.getCellSize() +
                            '" data-repdate="' + rday.getRepDate(element.scaleGroup) + '">' +
                            '<div class="fn-label">' + rday.getDate() + '</div></div>');
                        dowArr.push(
                            '<div class="row day ' + dayClass + '"' +
                            ' id="dw-' + tools.genId(rday) +
                            '" data-repdate="' + rday.getRepDate(element.scaleGroup) + '">' +
                            '<div class="fn-label">' + settings.dow[day] + '</div></div>');
                    } //for

                    // Last year
                    yearArr.push(
                        '<div class="row header year" style="width: ' +
                        tools.getCellSize() * scaleUnitsThisYear + 'px;"><div class="fn-label">' +
                        year +
                        '</div></div>');

                    // Last month
                    monthArr.push(
                        '<div class="row header month" style="width: ' +
                        tools.getCellSize() * scaleUnitsThisMonth + 'px"><div class="fn-label">' +
                        settings.months[month] +
                        '</div></div>');

                    dataPanel = core.dataPanel(element, range.length * tools.getCellSize());

                    // Append panel elements
                    dataPanel.append(
                        $row.clone().html(yearArr.join("")),
                        $row.clone().html(monthArr.join("")),
                        $row.clone().html(dayArr.join("")),
                        $row.clone().html(dowArr.join(""))
                    );
                }

                return $('<div class="rightPanel"></div>').append(dataPanel);
            },

            // **Navigation**
            navigation: function (element) {
                var ganttNavigate = null;
                // Scrolling navigation is provided by setting
                // `settings.navigate='scroll'`
                if (settings.navigate === "scroll") {
                    ganttNavigate = $('<div class="form-inline navigate" />')
                        .append($('<div class="nav-slider" />')
                            .append($('<div class="nav-slider-left" />')
                                .append(core.pageNavigation(element))
                                .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-page-back"/>')
                                    .prop("disabled", element.pageNum === 0)
                                    .html('<span class="glyphicon glyphicon-menu-up" aria-hidden="true"></span>')
                                    .click(function() {
                                        core.navigatePage(element, -1);
                                    }))
                                .append($('<div class="page-number"/>')
                                    .append($('<span/>')
                                        .html(element.pageNum + 1 + ' / ' + element.pageCount)))
                                .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-page-next"/>')
                                    .prop("disabled", element.pageNum + 1 === element.pageCount)
                                    .html('<span class="glyphicon glyphicon-menu-down" aria-hidden="true"></span>')
                                    .click(function() {
                                        core.navigatePage(element, 1);
                                    }))
                                .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-now"/>')
                                    .html('<span class="glyphicon glyphicon-time" aria-hidden="true"></span>')
                                    .click(function () {
                                        core.navigateTo(element, 'now');
                                    }))
                                .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-prev-week"/>')
                                    .html('<span class="glyphicon glyphicon-backward" aria-hidden="true"></span>')
                                    .click(function() {
                                       core.navigateTo(element, tools.getCellSize() * 8);
                                    }))
                                .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-prev-day"/>')
                                    .html('<span class="glyphicon glyphicon-triangle-left" aria-hidden="true"></span>')
                                    .click(function() {
                                        core.navigateTo(element, tools.getCellSize() * 4);
                                    })))
                            .append($('<div class="nav-slider-content" />')
                                    .append($('<div class="nav-slider-bar" />')
                                            .append($('<a class="nav-slider-button" />')
                                                )
                                                .mousedown(function (e) {
                                                    e.preventDefault();
                                                    element.scrollNavigation.scrollerMouseDown = true;
                                                    core.sliderScroll(element, e);
                                                })
                                                .mousemove(function (e) {
                                                    if (element.scrollNavigation.scrollerMouseDown) {
                                                        core.sliderScroll(element, e);
                                                    }
                                                })
                                            )
                                        )
                            .append($('<div class="nav-slider-right" />')
                                .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-next-day"/>')
                                    .html('<span class="glyphicon glyphicon-triangle-right" aria-hidden="true"></span>')
                                    .click(function() {
                                        core.navigateTo(element, tools.getCellSize() * -4);
                                    }))
                                .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-next-week"/>')
                                    .html('<span class="glyphicon glyphicon-forward" aria-hidden="true"></span>')
                                    .click(function() {
                                        core.navigateTo(element, tools.getCellSize() * -8);
                                    }))
                                .append(core.zoomNavigate(element))
                                    )
                                );
                    $(document).mouseup(function () {
                        element.scrollNavigation.scrollerMouseDown = false;
                    });
                // Button navigation is provided by setting `settings.navigation='buttons'`
                } else {
                    ganttNavigate = $('<div class="form-inline navigate" />')
                        .append(core.pageNavigation(element))
                        .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-begin"/>')
                            .html('<span class="glyphicon glyphicon-step-backward" aria-hidden="true"></span>')
                            .click(function () {
                                core.navigateTo(element, 'begin');
                            }))
                        .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-prev-week"/>')
                            .html('<span class="glyphicon glyphicon-backward" aria-hidden="true"></span>')
                            .click(function() {
                               core.navigateTo(element, tools.getCellSize() * 8);
                            }))
                        .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-prev-day"/>')
                            .html('<span class="glyphicon glyphicon-triangle-left" aria-hidden="true"></span>')
                            .click(function() {
                                core.navigateTo(element, tools.getCellSize() * 4);
                            }))
                        .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-now"/>')
                            .html('<span class="glyphicon glyphicon-time" aria-hidden="true"></span>')
                            .click(function () {
                                core.navigateTo(element, 'now');
                            }))
                        .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-next-day"/>')
                            .html('<span class="glyphicon glyphicon-triangle-right  " aria-hidden="true"></span>')
                            .click(function() {
                                core.navigateTo(element, tools.getCellSize() * -4);
                            }))
                        .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-next-week"/>')
                            .html('<span class="glyphicon glyphicon-forward" aria-hidden="true"></span>')
                            .click(function() {
                                core.navigateTo(element, tools.getCellSize() * -8);
                            }))
                        .append($('<button type="button" class="btn btn-info btn-sm nav-link nav-end"/>')
                            .html('<span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span>')
                            .click(function () {
                                core.navigateTo(element, 'end');
                            }))
                        .append(core.zoomNavigate(element));
                }
                return $('<div class="bottom"></div>').append(ganttNavigate);
            },

            pageNavigation : function(element) {
                return $('<button type="button" class="btn btn-info btn-sm nav-link nav-page-back"/>')
                   .prop("disabled", element.pageNum === 0)
                   .html('<span class="glyphicon glyphicon-menu-up" aria-hidden="true"></span>')
                   .click(function() {
                       core.navigatePage(element, -1);
                   })
               .add($('<div class="page-number"/>')
                       .append($('<span/>')
                           .html(element.pageNum + 1 + ' / ' + element.pageCount)))
               .add($('<button type="button" class="btn btn-info btn-sm nav-link nav-page-next"/>')
                   .prop("disabled", element.pageNum + 1 === element.pageCount)
                   .html('<span class="glyphicon glyphicon-menu-down" aria-hidden="true"></span>')
                   .click(function() {
                       core.navigatePage(element, 1);
                   }))
                .add(settings.itemsPerPageSelect.length <= 0 ? '' : core.getSelect(settings.itemsPerPageSelect)
                    .addClass('form-control input-sm nav-page-select')
                    .change(function () {
                        var previous = settings.itemsPerPage;
                        settings.itemsPerPage = Number($(this).val());
                        // new page num. keep highlitedRow, if exists. other wise keep fist
                        var firstColumn = element.pageNum  * previous;
                        var lastColumn = Math.min((element.pageNum+1) * previous - 1, element.rowsNum - 1);
                        var targetRow = element.highlightedRow && element.highlightedRow >= firstColumn && element.highlightedRow <= lastColumn ?
                            element.highlightedRow : firstColumn;
                        element.pageNum = Math.floor(targetRow / settings.itemsPerPage);
                        core.refresh(element);
                    }));
            },

            zoomNavigate: function (element) {
                return $('<button type="button" class="btn btn-info btn-sm nav-link nav-zoomIn"/>')
                    .prop("disabled", settings.scale == settings.minScale)
                    .html('<span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>')
                    .click(function() {
                        core.zoomInOut(element, -1);
                    })
                .add($('<button type="button" class="btn btn-info btn-sm  nav-link nav-zoomOut"/>')
                    .prop("disabled", settings.scale == settings.maxScale)
                    .html('<span class="glyphicon glyphicon-zoom-out" aria-hidden="true"></span>')
                    .click(function() {
                        core.zoomInOut(element, 1);
                    }));

            },

            getSelect: function (optionArr) {
                var selectTag = $('<select>');
                $.each(optionArr, function(i, value) {
                    selectTag.append($('<option>').text(value).val(value).prop('selected', value === settings.itemsPerPage));
                });

                return selectTag;
            },

            // **Progress Bar**
            // Return an element representing a progress of position within the entire chart
            createProgressBar: function (days, label, desc, classNames, dataObj) {
                label = label || "";
                var cellWidth = tools.getCellSize();
                var minCellWidth = Math.floor(cellWidth / 4);
                var barMarg = tools.getProgressBarMargin() || 0;
                var bar = $('<div class="bar"><div class="fn-label">' + label + '</div></div>')
                        .css({
                            width: (Math.max(Math.floor(cellWidth * days), minCellWidth) - barMarg) + 2
                        })
                        .data("dataObj", dataObj);
                if (desc) {
                    bar
                      .mouseenter(function (e) {
                          var hint = $('<div class="fn-gantt-hint" />').html(desc);
                          $("body").append(hint);
                          hint.css("left", e.pageX);
                          hint.css("top", e.pageY);
                          hint.show();
                      })
                      .mouseleave(function () {
                          $(".fn-gantt-hint").remove();
                      })
                      .mousemove(function (e) {
                          $(".fn-gantt-hint").css("left", e.pageX);
                          $(".fn-gantt-hint").css("top", e.pageY + 15);
                      });
                }
                if (classNames) {
                    bar.addClass(classNames);
                }
                bar.click(function (e) {
                    e.stopPropagation();
                    settings.onItemClick($(this).data("dataObj"));
                });
                return bar;
            },

            // Remove the `wd` (weekday) class and add `today` class to the
            // current day/week/month (depending on the current scale)
            markNow: function (element) {
                var cd = new Date().setHours(0, 0, 0, 0);

                var scaleStep = scaleSettings[settings.scale].scaleStep;
                var now = $(element).find('#dh-' + tools.genId(cd, scaleStep));
                now.removeClass('wd').addClass('today');

                var $dataPanel = $(element).find(".fn-gantt .rightPanel .dataPanel");
                $(element).find(".fn-gantt .bottom .navigate button.nav-now").prop("disabled", !element.scrollNavigation.canScroll || !$dataPanel.find(".today").length);

            },

            // **Fill the Chart**
            // Parse the data and fill the data panel
            fillData: function (element, datapanel, leftpanel /* <- never used? */) {
                var invertColor = function (colStr) {
                    try {
                        colStr = colStr.replace("rgb(", "").replace(")", "");
                        var rgbArr = colStr.split(",");
                        var R = parseInt(rgbArr[0], 10);
                        var G = parseInt(rgbArr[1], 10);
                        var B = parseInt(rgbArr[2], 10);
                        var gray = Math.round((255 - (0.299 * R + 0.587 * G + 0.114 * B)) * 0.9);
                        return "rgb(" + gray + ", " + gray + ", " + gray + ")";
                    } catch (err) {
                        return "";
                    }
                };
                // Loop through the values of each data element and set a row
                $.each(element.data, function (i, entry) {
                    if (i >= element.pageNum * settings.itemsPerPage &&
                        i < (element.pageNum * settings.itemsPerPage + settings.itemsPerPage)) {

                        $.each(entry.values, function (j, day) {
                            var _bar;
                            var from, to, cFrom, cTo, dFrom, dTo, eFrom, eTo, dl;
                            var topEl, top;
                            var headerRows = scaleGroupSttings[element.scaleGroup].headerRows;
                            var scaleStep = scaleSettings[settings.scale].scaleStep;
                            var cellStep = scaleStep * scaleGroupSttings[element.scaleGroup].cellStep;

                            dFrom = tools.dateDeserialize(day.from);
                            dTo = tools.dateDeserialize(day.to);
                            
                            from = $(element).find('#dh-' + tools.genId(dFrom, scaleStep));
                            to = $(element).find('#dh-' + tools.genId(dTo, scaleStep));
                            cFrom = from.data("offset");
                            cTo = to.data("offset");

                            switch (element.scaleGroup) {

                            // **Hourly data**
                            case "hours":
                                var hour = Math.floor(dFrom.getHours() / scaleStep) * scaleStep;
                                eFrom = dFrom - (new Date(dFrom.getFullYear(), dFrom.getMonth(), dFrom.getDate(), hour)).getTime();
                                hour = Math.floor(dTo.getHours() / scaleStep) * scaleStep;
                                eTo = dTo - (new Date(dTo.getFullYear(), dTo.getMonth(), dTo.getDate(), hour)).getTime();
                                break;
                            // **Weekly data**
                            case "weeks":
                                eFrom = dFrom - dFrom.getDayForWeek().getTime();
                                eTo = dTo - dTo.getDayForWeek().getTime();
                                break;
                            // **Monthly data**
                            case "months":
                                eFrom = dFrom - (new Date(dFrom.getFullYear(), dFrom.getMonth(), 1)).getTime();
                                eTo = dTo - (new Date(dTo.getFullYear(), dTo.getMonth(), 1)).getTime();
                                break;
                            // **Days**
                            case "days":
                                /* falls through */
                            default:
                                eFrom = dFrom - (new Date(dFrom.getFullYear(), dFrom.getMonth(), dFrom.getDate())).getTime();
                                eTo = dTo - (new Date(dTo.getFullYear(), dTo.getMonth(), dTo.getDate())).getTime();
                            }

                            if (settings.snapToGrid){
                                dl = (cTo - cFrom) / tools.getCellSize();
                                if (eTo !== 0) {
                                    dl++;
                                }
                            } else {
                                if (element.scaleGroup == "months") {
                                    cellStep = (new Date(dFrom.getFullYear(), dFrom.getMonth() + 1, 0)).getDate() * UTC_DAY_IN_MS;
                                }
                                cFrom += (eFrom % cellStep) / (cellStep * 1.0) * tools.getCellSize();
                                if (element.scaleGroup == "months") {
                                    cellStep = (new Date(dTo.getFullYear(), dTo.getMonth() + 1, 0)).getDate() * UTC_DAY_IN_MS;
                                }
                                cTo += (eTo % cellStep) / (cellStep * 1.0) * tools.getCellSize();
                                dl = (cTo - cFrom) / tools.getCellSize();

                                cFrom = Math.round(cFrom);
                            }

                            _bar = core.createProgressBar(dl, day.label, day.desc, day.customClass, day.dataObj);

                            // find row
                            topEl = $(element).find("#rowheader" + i);
                            top = tools.getCellSize() * headerRows + 2 + topEl.data("offset");
                            _bar.css({ 'top': top, 'left': Math.floor(cFrom) });

                            datapanel.append(_bar);

                            var $l = _bar.find(".fn-label");
                            if ($l && _bar.length) {
                                var gray = invertColor(_bar[0].style.backgroundColor);
                                $l.css("color", gray);
                            } else if ($l) {
                                $l.css("color", "");
                            }
                        });

                    }
                });
            },

            setRowClick: function(element, row, rowNum) {
                row.click(function() {
                    if (settings.highlightRow) {
                        // remove highlight
                         $(element).find(".fn-gantt .rightPanel .dataPanel .highlight").remove();

                        if(element.highlightedRow === rowNum) {
                            // currently highlighted
                            element.highlightedRow = null;
                            return false;
                        }

                        // currently no highlight or highlight another line
                        core.highlightRow(element, rowNum);
                    }

                });
            },

            highlightRow: function(element, rowNum) {
                var $dataPanel = $(element).find(".fn-gantt .rightPanel .dataPanel");

                var topEl = $(element).find("#rowheader" + rowNum);
                if (topEl.length > 0) {
                    var headerRows = scaleGroupSttings[element.scaleGroup].headerRows;
                    var top = tools.getCellSize() * headerRows + topEl.data("offset");

                    var highlight = $('<div>').addClass('highlight').css('top', top);
                    $dataPanel.append(highlight);

                    element.highlightedRow = rowNum;
                }
            },

            // **Navigation**
            navigateTo: function (element, val) {
                if (!element.scrollNavigation.canScroll) {
                    return;
                }
                var $dataPanel = $(element).find(".fn-gantt .rightPanel .dataPanel");
                var shift = function () {
                    core.switchScrollButton(element);
                    core.repositionLabel(element);
                };
                var panelMargin;
                switch (val) {
                case "begin":
                    panelMargin = 0;
                    break;
                case "end":
                    panelMargin = element.scrollNavigation.panelMaxPos;
                    break;
                case "now":
                    if (!$dataPanel.find(".today").length) {
                        return false;
                    }

                    panelMargin = $dataPanel.find(".today").offset().left - $dataPanel.offset().left;
                    panelMargin *= -1;

                    panelMargin = (panelMargin < 0 ? panelMargin : 0);
                    panelMargin = (panelMargin > element.scrollNavigation.panelMaxPos ? panelMargin : element.scrollNavigation.panelMaxPos);

                    break;
                default:
                    panelMargin = parseInt($dataPanel.css("margin-left").replace("px", ""), 10);
                    panelMargin += val;

                    panelMargin = (panelMargin < 0 ? panelMargin : 0);
                    panelMargin = (panelMargin > element.scrollNavigation.panelMaxPos ? panelMargin : element.scrollNavigation.panelMaxPos);

                }
                
                $dataPanel.animate({ "margin-left": panelMargin }, "fast", shift);

                core.synchronizeScroller(element);
            },

            // Navigate to a specific page
            navigatePage: function (element, val) {
                if ((element.pageNum + val) >= 0 &&
                    (element.pageNum + val) < Math.ceil(element.rowsNum / settings.itemsPerPage)) {
                    core.waitToggle(element, function () {
                        element.pageNum += val;
                        element.hPosition = $(".fn-gantt .dataPanel").css("margin-left").replace("px", "");
                        element.scaleOldWidth = false;
                        core.init(element);
                    });
                }
            },

            refresh: function(element) {
                core.create(element);
            },

            // Change zoom level
            zoomInOut: function (element, val) {
                core.waitToggle(element, function () {

                    var zoomIn = (val < 0);

                    var index = $.inArray(settings.scale, scales);
                    if ((zoomIn && index <=  $.inArray(settings.minScale, scales)) ||
                         (!zoomIn && index >=  $.inArray(settings.maxScale, scales))) {
                        // do nothing if attempting to zoom past max/min
                        core.waitToggle(element);
                        return;
                    }

                    index = zoomIn ? index - 1 : index + 1;

                    settings.scale = scales[index];
                    element.scaleGroup = scaleSettings[settings.scale].scaleGroup;

                    var $rightPanel = $(element).find(".fn-gantt .rightPanel");
                    var $dataPanel = $rightPanel.find(".dataPanel");
                    element.hPosition = $dataPanel.css("margin-left").replace("px", "");
                    element.scaleOldWidth = ($dataPanel.width() - $rightPanel.width());

                    if (settings.useCookie) {
                        $.cookie(settings.cookieKey + "CurrentScale", settings.scale);
                        // reset scrollPos
                        $.cookie(settings.cookieKey + "ScrollPos", null);
                    }
                    core.init(element);
                });
            },

            // Move chart via mouseclick
            mouseScroll: function (element, e) {
                var $dataPanel = $(element).find(".fn-gantt .dataPanel");
                $dataPanel.css("cursor", "move");
                var bPos = $dataPanel.offset();
                var mPos = element.scrollNavigation.mouseX === null ? e.pageX : element.scrollNavigation.mouseX;
                var delta = e.pageX - mPos;
                element.scrollNavigation.mouseX = e.pageX;

                core.scrollPanel(element, delta);

                clearTimeout(element.scrollNavigation.repositionDelay);
                element.scrollNavigation.repositionDelay = setTimeout(core.repositionLabel, 50, element);
            },

            // Move chart via mousewheel
            wheelScroll: function (element, e) {
                e.preventDefault(); // e is a jQuery Event

                // attempts to normalize scroll wheel velocity
                var delta = ( 'detail' in e ? e.detail :
                              'wheelDelta' in e.originalEvent ? - 1/120 * e.originalEvent.wheelDelta :
                              e.originalEvent.deltaY ? e.originalEvent.deltaY / Math.abs(e.originalEvent.deltaY) :
                              e.originalEvent.detail );

                // simpler normalization, ignoring per-device/browser/platform acceleration & semantic variations
                //var delta = e.detail || - (e = e.originalEvent).wheelData || e.deltaY /* || e.deltaX */ || e.detail;
                //delta = ( delta / Math.abs(delta) ) || 0;

                core.scrollPanel(element, -50 * delta);

                clearTimeout(element.scrollNavigation.repositionDelay);
                element.scrollNavigation.repositionDelay = setTimeout(core.repositionLabel, 50, element);
            },

            // Move chart via slider control
            sliderScroll: function (element, e) {
                var $sliderBar = $(element).find(".nav-slider-bar");
                var $sliderBarBtn = $sliderBar.find(".nav-slider-button");
                var $dataPanel = $(element).find(".fn-gantt .rightPanel .dataPanel");

                var bPos = $sliderBar.offset();
                var bWidth = $sliderBar.width();
                var wButton = $sliderBarBtn.width();

                var pos = e.pageX - bPos.left;
                pos = pos < 0 ? 0 : pos;
                pos = pos > bWidth ? bWidth : pos;
                $sliderBarBtn.css("left", pos - wButton / 2);

                var panelMargin = pos * element.scrollNavigation.panelMaxPos / bWidth;

                $dataPanel.css("margin-left", panelMargin);

                core.switchScrollButton(element);
                clearTimeout(element.scrollNavigation.repositionDelay);
                element.scrollNavigation.repositionDelay = setTimeout(core.repositionLabel, 5, element);
            },

            // Update scroll panel margins
            scrollPanel: function (element, delta) {
                if (!element.scrollNavigation.canScroll) {
                    return false;
                }
                var $dataPanel = $(element).find(".fn-gantt .dataPanel");
                var panelMargin = parseInt($dataPanel.css("margin-left").replace("px", ""), 10);
                panelMargin += delta;

                panelMargin = (panelMargin <= 0 ? panelMargin : 0);
                panelMargin = (panelMargin >= element.scrollNavigation.panelMaxPos ? panelMargin : element.scrollNavigation.panelMaxPos);

                $dataPanel.css("margin-left", panelMargin);

                core.switchScrollButton(element);
                core.synchronizeScroller(element);
            },

            // Synchronize scroller
            synchronizeScroller: function (element) {
                if (settings.navigate !== "scroll") { return; }
                var $dataPanel = $(element).find(".fn-gantt .rightPanel .dataPanel");
                var $sliderBar = $(element).find(".nav-slider-bar");
                var $sliderBtn = $sliderBar.find(".nav-slider-button");

                var bWidth = $sliderBar.width();
                var wButton = $sliderBtn.width();

                var hPos = $dataPanel.css("margin-left") || 0;
                if (hPos) {
                    hPos = hPos.replace("px", "");
                }
                var pos = hPos * bWidth / element.scrollNavigation.panelMaxPos;

                $sliderBtn.css("left", pos - wButton/2);
            },

            // Reposition data labels
            repositionLabel: function (element) {
                setTimeout(function () {
                    var $dataPanel;
                    if (!element) {
                        $dataPanel = $(".fn-gantt .rightPanel .dataPanel");
                    } else {
                        var $rightPanel = $(element).find(".fn-gantt .rightPanel");
                        $dataPanel = $rightPanel.find(".dataPanel");
                    }

                    if (settings.useCookie) {
                        $.cookie(settings.cookieKey + "ScrollPos", $dataPanel.css("margin-left").replace("px", ""));
                    }
                }, 200);
            },

            switchScrollButton: function(element) {
                // enable all scroll button
                // navigation
                var $navigate = $(element).find(".fn-gantt .bottom .navigate");
                $navigate.find('button.nav-begin, button.nav-prev-week, button.nav-prev-day, button.nav-next-day, button.nav-next-week, button.nav-end')
                    .prop("disabled", false);

                // Margin
                var $dataPanel = $(element).find(".fn-gantt .rightPanel .dataPanel");
                var panelMargin = parseInt($dataPanel.css("margin-left").replace("px", ""), 10);
                
                // prevButton
                $navigate.find('button.nav-begin, button.nav-prev-week, button.nav-prev-day').prop("disabled", !element.scrollNavigation.canScroll || panelMargin >= 0);

                // nextButton
                $navigate.find('button.nav-end, button.nav-next-week, button.nav-next-day').prop("disabled", !element.scrollNavigation.canScroll || panelMargin <= element.scrollNavigation.panelMaxPos);


            },

            // waitToggle
            waitToggle: function (element, showCallback) {
                if ( $.isFunction(showCallback) ) {
                    var $elt = $(element);

                    if (!element.loader) {
                        element.loader = $('<div class="fn-gantt-loader">' +
                        '<div class="fn-gantt-loader-spinner"><span>' + settings.waitText + '</span></div></div>');
                    }
                    $elt.append(element.loader);
                    setTimeout(showCallback, 200);

                } else if (element.loader) {
                    element.loader.detach();
                }
            }
        };

        // Utility functions
        // =================
        var tools = {

            // Return the maximum available date in data depending on the scale
            getMaxDate: function (element) {
                var maxDate = null;
                $.each(element.data, function (i, entry) {
                    $.each(entry.values, function (i, date) {
                        maxDate = maxDate < tools.dateDeserialize(date.to) ? tools.dateDeserialize(date.to) : maxDate;
                    });
                });
                maxDate = maxDate || new Date();
                var bd;
                switch (element.scaleGroup) {
                case "hours":
                    var scaleStep = scaleSettings[settings.scale].scaleStep;
                    maxDate.setHours(Math.ceil((maxDate.getHours()) / scaleStep) * scaleStep);
                    maxDate.setHours(maxDate.getHours() + scaleStep * 3);
                    break;
                case "weeks":
                    // wtf is happening here?
                    bd = new Date(maxDate.getTime());
                    bd = new Date(bd.setDate(bd.getDate() + 3 * 7));
                    var md = Math.floor(bd.getDate() / 7) * 7;
                    maxDate = new Date(bd.getFullYear(), bd.getMonth(), md === 0 ? 4 : md - 3);
                    break;
                case "months":
                    bd = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
                    bd.setMonth(bd.getMonth() + 2);
                    maxDate = new Date(bd.getFullYear(), bd.getMonth(), 1);
                    break;
                case "days":
                    /* falls through */
                default:
                    maxDate.setHours(0);
                    maxDate.setDate(maxDate.getDate() + 3);
                }
                return maxDate;
            },

            // Return the minimum available date in data depending on the scale
            getMinDate: function (element) {
                var minDate = null;
                $.each(element.data, function (i, entry) {
                    $.each(entry.values, function (i, date) {
                        minDate = minDate > tools.dateDeserialize(date.from) ||
                            minDate === null ? tools.dateDeserialize(date.from) : minDate;
                    });
                });
                minDate = minDate || new Date();
                switch (element.scaleGroup) {
                case "hours":
                    var scaleStep = scaleSettings[settings.scale].scaleStep;
                    minDate.setHours(Math.floor((minDate.getHours()) / scaleStep) * scaleStep);
                    minDate.setHours(minDate.getHours() - scaleStep * 3);
                    break;
                case "weeks":
                    // wtf is happening here?
                    var bd = new Date(minDate.getTime());
                    bd = new Date(bd.setDate(bd.getDate() - 3 * 7));
                    var md = Math.floor(bd.getDate() / 7) * 7;
                    minDate = new Date(bd.getFullYear(), bd.getMonth(), md === 0 ? 4 : md - 3);
                    break;
                case "months":
                    minDate.setHours(0, 0, 0, 0);
                    minDate.setDate(1);
                    minDate.setMonth(minDate.getMonth() - 3);
                    break;
                case "days":
                    /* falls through */
                default:
                    minDate.setHours(0, 0, 0, 0);
                    minDate.setDate(minDate.getDate() - 3);
                }
                return minDate;
            },

            // Return an array of Date objects between `from` and `to`
            parseDateRange: function (from, to) {
                var current = new Date(from.getTime());
                var ret = [];
                var i = 0;
                do {
                    ret[i++] = new Date(current.getTime());
                    current.setDate(current.getDate() + 1);
                } while (current <= to);
                return ret;
            },

            // Return an array of Date objects between `from` and `to`,
            // scaled hourly
            parseTimeRange: function (from, to, scaleStep) {
                var current = new Date(from);
                var end = new Date(to);

                current.setHours(0, 0, 0, 0);

                end.setMilliseconds(0);
                end.setSeconds(0);
                if (end.getMinutes() > 0 || end.getHours() > 0) {
                    end.setMinutes(0);
                    end.setHours(0);
                    end.setTime(end.getTime() + UTC_DAY_IN_MS);
                }

                var ret = [];
                var i = 0;
                for(;;) {
                    var dayStartTime = new Date(current);
                    dayStartTime.setHours(Math.floor((current.getHours()) / scaleStep) * scaleStep);

                    if (ret[i] && dayStartTime.getDay() !== ret[i].getDay()) {
                        // If mark-cursor jumped to next day, make sure it starts at 0 hours
                        dayStartTime.setHours(0);
                    }
                    ret[i] = dayStartTime;

                    // Note that we use ">" because we want to include the end-time point.
                    if (current > to)  { break; }

                    /* BUG-2: current is moved backwards producing a dead-lock! (crashes chrome/IE/firefox)
                     * SEE: https://github.com/taitems/jQuery.Gantt/issues/62
                    if (current.getDay() !== ret[i].getDay()) {
                       current.setHours(0);
                    }
                    */

                    current = ktkGetNextDate(dayStartTime, scaleStep);

                    i++;
                }

                return ret;
            },

            // Return an array of Date objects between a range of weeks
            // between `from` and `to`
            parseWeeksRange: function (from, to) {
                var current = from.getDayForWeek();

                var ret = [];
                var i = 0;
                do {
                    ret[i++] = current.getDayForWeek();
                    current.setDate(current.getDate() + 7);
                } while (current <= to);

                return ret;
            },


            // Return an array of Date objects between a range of months
            // between `from` and `to`
            parseMonthsRange: function (from, to) {
                var current = new Date(from);
                var end = new Date(to); // <- never used?

                var ret = [];
                var i = 0;
                do {
                    ret[i++] = new Date(current.getFullYear(), current.getMonth(), 1);
                    current.setMonth(current.getMonth() + 1);
                } while (current <= to);

                return ret;
            },

            // Deserialize a date from a string or integer
            dateDeserialize: function (date) {
                if (typeof date === "string") {
                    date = date.replace(/\/Date\((.*)\)\//, "$1");
                    date = $.isNumeric(date) ? parseInt(date, 10) : $.trim(date);
                }
                return new Date( date );
            },

            // Generate an id for a date
            genId: function (t) { // varargs
                if ( $.isNumeric(t) ) {
                    t = new Date(t);
                }

                var scaleGroup = scaleSettings[settings.scale].scaleGroup;
                switch (scaleGroup) {
                case "hours":
                    var hour = t.getHours();
                    if (arguments.length >= 2) {
                        hour = (Math.floor(t.getHours() / arguments[1]) * arguments[1]);
                    }
                    return (new Date(t.getFullYear(), t.getMonth(), t.getDate(), hour)).getTime();
                case "weeks":
                    return t.getWeekId();
                case "months":
                    return t.getFullYear() + "-" + t.getMonth();
                case "days":
                    /* falls through */
                default:
                    return (new Date(t.getFullYear(), t.getMonth(), t.getDate())).getTime();
                }
            },

            // normalizes an array of dates into a map of start-of-day millisecond values
            _datesToDays: function ( dates ) {
                var dayMap = {};
                for (var i = 0, len = dates.length, day; i < len; i++) {
                    day = tools.dateDeserialize( dates[i] );
                    dayMap[ day.setHours(0, 0, 0, 0) ] = true;
                }
                return dayMap;
            },
            // Returns true when the given date appears in the array of holidays, if provided
            isHoliday: (function() { // IIFE
                // short-circuits the function if no holidays option was passed
                if (!settings.holidays || !settings.holidays.length) {
                  return function () { return false; };
                }
                var holidays = false;
                // returns the function that will be used to check for holidayness of a given date
                return function(date) {
                    if (!holidays) {
                      holidays = tools._datesToDays( settings.holidays );
                    }
                    return !!holidays[
                      // assumes numeric dates are already normalized to start-of-day
                      $.isNumeric(date) ?
                      date :
                      ( new Date(date.getFullYear(), date.getMonth(), date.getDate()) ).getTime()
                    ];
                };
            })(),

            // Get the current cell height
            getCellSize: function () {
                if (typeof tools._getCellSize === "undefined") {
                    var measure = $('<div style="display: none; position: absolute;" class="fn-gantt"><div class="row"></div></div>');
                    $("body").append(measure);
                    tools._getCellSize = measure.find(".row").height();
                    measure.empty().remove();
                }
                return tools._getCellSize;
            },

            // Get the current page height
            getPageHeight: function (element) {
                return element.pageNum + 1 === element.pageCount ? element.rowsOnLastPage * tools.getCellSize() : settings.itemsPerPage * tools.getCellSize();
            },

            // Get the current margin size of the progress bar
            getProgressBarMargin: function () {
                if (typeof tools._getProgressBarMargin === "undefined") {
                    var measure = $('<div style="display: none; position: absolute;"><div class="fn-gantt"><div class="rightPanel"><div class="dataPanel"><div class="row day"><div class="bar"></div></div></div></div></div></div>');
                    var bar = measure.find(".fn-gantt .rightPanel .day .bar");
                    $("body").append(measure);
                    tools._getProgressBarMargin = parseInt(bar.css("margin-left").replace("px", ""), 10);
                    tools._getProgressBarMargin += parseInt(bar.css("margin-right").replace("px", ""), 10);
                    measure.empty().remove();
                }
                return tools._getProgressBarMargin;
            }
        };


        this.each(function () {
            this.data = null;        // Received data
            this.pageNum = 0;        // Current page number
            this.pageCount = 0;      // Available pages count
            this.rowsOnLastPage = 0; // How many rows on last page
            this.rowsNum = 0;        // Number of total rows
            this.highlightedRow = null;  // Currnt highlighted row number
            this.hPosition = 0;      // Current position on diagram (Horizontal)
            this.dateStart = null;
            this.dateEnd = null;
            this.scrollClicked = false;
            this.scaleOldWidth = null;

            // Update cookie with current scale
            if (settings.useCookie) {
                var sc = $.cookie(settings.cookieKey + "CurrentScale");
                if (sc) {
                    settings.scale = sc;
                } else {
                    $.cookie(settings.cookieKey + "CurrentScale", settings.scale);
                }
            }

            this.scaleGroup = scaleSettings[settings.scale].scaleGroup;

            this.scrollNavigation = {
                panelMouseDown: false,
                scrollerMouseDown: false,
                mouseX: null,
                repositionDelay: 0,
                panelMaxPos: 0,
                canScroll: true
            };

            this.gantt = null;
            this.loader = null;

            core.create(this);

        });

    };
})(jQuery);
