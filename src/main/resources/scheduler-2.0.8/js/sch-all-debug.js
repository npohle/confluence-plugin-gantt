/*
Ext Scheduler 2.0.8
Copyright(c) 2009-2012 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Sch.view.Locking', {
    
    extend : 'Ext.grid.LockingView',

    scheduleEventRelayRe: /^(schedule|event|beforeevent|afterevent|dragcreate|beforedragcreate|afterdragcreate|beforetooltipshow)/,
    
    constructor: function(config){
        this.callParent(arguments);
        
        var me = this,
            eventNames = [],
            eventRe = me.scheduleEventRelayRe,
            normal = config.normal.getView(),
            events = normal.events,
            event;
        
        for (event in events) {
            if (events.hasOwnProperty(event) && eventRe.test(event)) {
                eventNames.push(event);
            }
        }
        me.relayEvents(normal, eventNames);
    },
    
    getElementFromEventRecord : function (record) {
        return this.normal.getView().getElementFromEventRecord(record);
    },
    
    
    onClear : function () {
        this.relayFn('onClear', arguments);
    },

    // For tree view
    beginBulkUpdate : function() {
        this.relayFn('beginBulkUpdate', arguments);
    },

    // For tree view
    endBulkUpdate : function() {
        this.relayFn('endBulkUpdate', arguments);
    }
});
/*
 * @class Sch.ClockTemplate
 * @private
 * Template showing a clock, accepts an object containing a 'date' and a 'text' property to its apply method.
 * @constructor
 * @param {Object} config The object containing the configuration of this model.
 */
Ext.define("Sch.tooltip.ClockTemplate", {

    constructor : function() {
        var toRad = Math.PI / 180,
            cos = Math.cos,
            sin = Math.sin,
            minuteHeight = 7,
            minuteTop = 2,
            minuteLeft = 10,
            hourHeight = 6,
            hourTop = 3,
            hourLeft = 10;

        function getHourStyleIE(degrees) {
            var rad = degrees * toRad,
                cosV = cos(rad),
                sinV = sin(rad),
                y = hourHeight * sin((90-degrees)*toRad),
                x =hourHeight * cos((90-degrees)*toRad),
                topAdjust = Math.min(hourHeight, hourHeight - y),
                leftAdjust = degrees > 180 ? x : 0,
                matrixString = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + cosV + ", M12 = " + (-sinV) + ", M21 = " + sinV + ", M22 = " + cosV + ")";
        
            return Ext.String.format("filter:{0};-ms-filter:{0};top:{1}px;left:{2}px;", matrixString, topAdjust+hourTop, leftAdjust+hourLeft);
        }

        function getMinuteStyleIE(degrees) {
            var rad = degrees * toRad,
                cosV = cos(rad),
                sinV = sin(rad),
                y = minuteHeight * sin((90-degrees)*toRad),
                x = minuteHeight * cos((90-degrees)*toRad),
                topAdjust = Math.min(minuteHeight, minuteHeight - y),
                leftAdjust = degrees > 180 ? x : 0,
                matrixString = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + cosV + ", M12 = " + (-sinV) + ", M21 = " + sinV + ", M22 = " + cosV + ")";
        
            return Ext.String.format("filter:{0};-ms-filter:{0};top:{1}px;left:{2}px;", matrixString, topAdjust+minuteTop, leftAdjust+minuteLeft);
        }

        function getStyle(degrees) {
            return Ext.String.format("transform:rotate({0}deg);-moz-transform: rotate({0}deg);-webkit-transform: rotate({0}deg);-o-transform:rotate({0}deg);", degrees);
        }

        return new Ext.XTemplate(
            '<div class="sch-clockwrap {cls}">' +
                '<div class="sch-clock">' +
                    '<div class="sch-hourIndicator" style="{[this.getHourStyle((values.date.getHours()%12) * 30)]}">{[Ext.Date.monthNames[values.date.getMonth()].substr(0,3)]}</div>' +
                    '<div class="sch-minuteIndicator" style="{[this.getMinuteStyle(values.date.getMinutes() * 6)]}">{[values.date.getDate()]}</div>' +
                '</div>' +
                '<span class="sch-clock-text">{text}</span>' +
            '</div>',
            {
                compiled : true,
                disableFormats : true,

                getMinuteStyle : Ext.isIE ? getMinuteStyleIE : getStyle,
                getHourStyle : Ext.isIE ? getHourStyleIE : getStyle
            }
        );
    } 
});

/*
@class "Sch.tooltip.Tooltip"
@extends Ext.ToolTip
@private

Internal plugin showing a tooltip with event start/end information.
*/
Ext.define("Sch.tooltip.Tooltip", {
    extend : "Ext.tip.ToolTip",
    requires : [
        'Sch.tooltip.ClockTemplate'
    ],
    startText : 'Starts: ',
    
    endText : 'Ends: ',
    autoHide : false,
    anchor : 'b',
    padding: '0 3 0 0',
    showDelay : 0,
    hideDelay : 0,
    quickShowInterval : 0,
    dismissDelay : 0,
    trackMouse : false,
    valid : true,
    anchorOffset : 5,
    shadow : false,
    frame : false,

    constructor : function(config) {
        var clockTpl = Ext.create("Sch.tooltip.ClockTemplate");
        this.renderTo = document.body;
        this.startDate = this.endDate = new Date();

        if (!this.template) {
            this.template = Ext.create("Ext.XTemplate",
                '<div class="{[values.valid ? "sch-tip-ok" : "sch-tip-notok"]}">',
                   '{[this.renderClock(values.startDate, values.startText, "sch-tooltip-startdate")]}',
                   '{[this.renderClock(values.endDate, values.endText, "sch-tooltip-enddate")]}',
                '</div>',
                {
                    compiled : true,
                    disableFormats : true,

                    renderClock : function(date, text, cls) {
                        return clockTpl.apply({
                            date : date, 
                            text : text,
                            cls : cls
                        });
                    }
                }
            );
        }

        this.callParent(arguments);
    },

    update : function(startDate, endDate, valid) {

        if (this.startDate - startDate !== 0 ||
            this.endDate - endDate !== 0 ||
            this.valid !== valid) {
            
            // This will be called a lot so cache the values
            this.startDate = startDate;
            this.endDate = endDate;
            this.valid = valid;
            var startText = this.schedulerView.getFormattedDate(startDate),
                endText = this.schedulerView.getFormattedEndDate(endDate, startDate);

            // If resolution is day or greater, and end date is greater then start date
            if (this.mode === 'calendar' && endDate.getHours() === 0 && endDate.getMinutes() === 0 && 
                !(endDate.getYear() === startDate.getYear() && endDate.getMonth() === startDate.getMonth() && endDate.getDate() === startDate.getDate())) {
                endDate = Sch.util.Date.add(endDate, Sch.util.Date.DAY, -1);
            }
        
            this.callParent([
                this.template.apply({
                    valid: valid,
                    startDate: startDate,
                    startText: startText,
                    endText: endText,
                    endDate: endDate
                })
            ]);
        }
    },
     
    show : function(el, xOffset) {
        if (!el) {
            return;
        }

        if (Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0) {
            this.mode = 'calendar';
            this.el.addCls('sch-day-resolution');
        } else {
            this.mode = 'clock';
            this.el.removeCls('sch-day-resolution');
        }
        this.mouseOffsets = [xOffset - 18, -7];
        this.setTarget(el);
        this.callParent();
        this.alignTo(el, 'bl-tl', this.mouseOffsets);
    },

    onMouseMove : function() {
        this.el.alignTo(this.target, 'bl-tl', this.mouseOffsets);
        
        this.callParent(arguments);
    }
}); 

/**
 * @class Sch.util.Patch
 * @static
 * Utility class for Ext JS patches
 */
Ext.define('Sch.util.Patch', {
    /**
     * @cfg {String} target The class name to override
     */
    target      : null,

    /**
     * @cfg {String} minVersion The minimum Ext JS version for which this override is applicable. E.g. "4.0.5"
     */
    minVersion  : null,
    
    /**
     * @cfg {String} maxVersion The minimum Ext JS version for which this override is applicable. E.g. "4.0.7"
     */
    maxVersion  : null,

    /**
     * @cfg {String} reportUrl A url to the forum post describing the bug/issue in greater detail
     */
    reportUrl   : null,
    
    /**
     * @cfg {String} description A brief description of why this override is required
     */
    description : null,

    /**
     * @cfg {Boolean} ieOnly true if patch is only applicable to IE
     */
    ieOnly : false,

    onClassExtended: function(cls, data) {
        
        if (data.ieOnly && !Ext.isIE) return;

        if ((!data.minVersion || Ext.versions.extjs.equals(data.minVersion) || Ext.versions.extjs.isGreaterThan(data.minVersion)) && 
            (!data.maxVersion || Ext.versions.extjs.equals(data.maxVersion) || Ext.versions.extjs.isLessThan(data.maxVersion))) {
                
            data.requires[0].override(data.overrides);
        }
    }
});

/**
 * @class Sch.util.Date
 * @static
 * Static utility class for Date manipulation
 */
Ext.define('Sch.util.Date', {
    requires: 'Ext.Date',
    singleton: true,

    constructor: function () {
        Ext.apply(this, {
            /**
            * Date interval constant
            * @static
            * @type String
            */
            MILLI: Ext.Date.MILLI,

            /**
            * Date interval constant
            * @static
            * @type String
            */
            SECOND: Ext.Date.SECOND,

            /**
            * Date interval constant
            * @static
            * @type String
            */
            MINUTE: Ext.Date.MINUTE,

            /** Date interval constant
            * @static
            * @type String
            */
            HOUR: Ext.Date.HOUR,

            /**
            * Date interval constant
            * @static
            * @type String
            */
            DAY: Ext.Date.DAY,

            /**
            * Date interval constant
            * @static
            * @type String
            */
            WEEK: "w",

            /**
            * Date interval constant
            * @static
            * @type String
            */
            MONTH: Ext.Date.MONTH,

            /**
            * Date interval constant
            * @static
            * @type String
            */
            QUARTER: "q",

            /**
            * Date interval constant
            * @static
            * @type String
            */
            YEAR: Ext.Date.YEAR
        });

        var D = this,
            units = [D.MILLI, D.SECOND, D.MINUTE, D.HOUR, D.DAY, D.WEEK, D.MONTH, D.QUARTER, D.YEAR];

        Ext.apply(this, {
            /**
             * Returns 1 if first param is a greater unit than second param, -1 if the opposite is true or 0 if they're equal
             * @static
             * 
             * @param {String} unit1 The 1st unit
             * @param {String} unit2 The 2nd unit
             */ 
            compareUnits: function (u1, u2) {
                var ind1 = Ext.Array.indexOf(units, u1),
                    ind2 = Ext.Array.indexOf(units, u2);

                return ind1 > ind2 ? 1 : (ind1 < ind2 ? -1 : 0);
            }
        });
    },

    /**
    * Checks if this date is >= start and < end.
    * @param {Date} date The source date
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Boolean} true if this date falls on or between the given start and end dates.
    * @static
    */
    betweenLesser: function (date, start, end) {
        var t = date.getTime();
        return start.getTime() <= t && t < end.getTime();
    },

    /**
    * Constrains the date within a min and a max date
    * @param {Date} date The date to constrain
    * @param {Date} min Min date
    * @param {Date} max Max date
    * @return {Boolean} The constrained date
    * @static
    */
    constrain: function (date, min, max) {
        return this.min(this.max(date, min), max);
    },

    /**
    * Adds a date unit and interval 
    * @param {Date} date The source date 
    * @param {String} unit The date unit to add
    * @param {Int} value The number of units to add to the date
    * @return {Date} The new date
    * @static
    */
    add: function (date, unit, value) {
        var d = Ext.Date.clone(date);
        if (!unit || value === 0) return d;

        switch (unit.toLowerCase()) {
            case this.MILLI:
                d = new Date(date.getTime() + value);
                break;
            case this.SECOND:
                d = new Date(date.getTime() + (value * 1000));
                break;
            case this.MINUTE:
                d = new Date(date.getTime() + (value * 60000));
                break;
            case this.HOUR:
                d = new Date(date.getTime() + (value * 3600000));
                break;
            case this.DAY:
                d.setDate(date.getDate() + value);
                break;
            case this.WEEK:
                d.setDate(date.getDate() + value * 7);
                break;
            case this.MONTH:
                var day = date.getDate();
                if (day > 28) {
                    day = Math.min(day, Ext.Date.getLastDateOfMonth(this.add(Ext.Date.getFirstDateOfMonth(date), this.MONTH, value)).getDate());
                }
                d.setDate(day);
                d.setMonth(d.getMonth() + value);
                break;
            case this.QUARTER:
                d = this.add(date, this.MONTH, 3);
                break;
            case this.YEAR:
                d.setFullYear(date.getFullYear() + value);
                break;
        }
        return d;
    },

    
    getMeasuringUnit: function (unit) {
        if (unit === this.WEEK) {
            return this.DAY;
        }
        return unit;
    },

    
    /**
     * Returns a duration of the timeframe in the given units.   
     * @static
     * @param {Date} start The start date of the timeframe
     * @param {Date} end The end date of the timeframe
     * @param {String} unit Duration unit
     * @return {Number} The duration in the units 
     */
    getDurationInUnit: function (start, end, unit) {
        var units;

        switch (unit) {
            case this.QUARTER:
                units = Math.round(this.getDurationInMonths(start, end) / 3);
                break;

            case this.MONTH:
                units = Math.round(this.getDurationInMonths(start, end));
                break;

            case this.WEEK:
                units = Math.round(this.getDurationInDays(start, end)) / 7;
                break;

            case this.DAY:
                units = Math.round(this.getDurationInDays(start, end));
                break;

            case this.HOUR:
                units = Math.round(this.getDurationInHours(start, end));
                break;

            case this.MINUTE:
                units = Math.round(this.getDurationInMinutes(start, end));
                break;

            case this.SECOND:
                units = Math.round(this.getDurationInSeconds(start, end));
                break;

            case this.MILLI:
                units = Math.round(this.getDurationInMilliseconds(start, end));
                break;
        }

        return units;
    },

    
    getUnitToBaseUnitRatio: function (baseUnit, unit) {
        if (baseUnit === unit) {
            return 1;
        }

        switch (baseUnit) {
            case this.YEAR:
                switch (unit) {
                    case this.QUARTER:
                        return 1 / 4;

                    case this.MONTH:
                        return 1 / 12;
                }
                break;

            case this.QUARTER:
                switch (unit) {
                    case this.YEAR:
                        return 4;

                    case this.MONTH:
                        return 1 / 3;
                }
                break;

            case this.MONTH:
                switch (unit) {
                    case this.YEAR:
                        return 12;

                    case this.QUARTER:
                        return 3;
                }
                break;

            case this.WEEK:
                switch (unit) {
                    case this.DAY:
                        return 1 / 7;

                    case this.HOUR:
                        return 1 / 168;
                }
                break;

            case this.DAY:
                switch (unit) {
                    case this.WEEK:
                        return 7;

                    case this.HOUR:
                        return 1 / 24;

                    case this.MINUTE:
                        return 1 / 1440;
                }
                break;

            case this.HOUR:
                switch (unit) {
                    case this.DAY:
                        return 24;

                    case this.MINUTE:
                        return 1 / 60;
                }
                break;

            case this.MINUTE:
                switch (unit) {
                    case this.HOUR:
                        return 60;

                    case this.SECOND:
                        return 1 / 60;

                    case this.MILLI:
                        return 1 / 60000;
                }
                break;

            case this.SECOND:
                switch (unit) {
                    case this.MILLI:
                        return 1 / 1000;
                }
                break;
                
                
            case this.MILLI:
                switch (unit) {
                    case this.SECOND:
                        return 1000;
                }
                break;
                
        }

        return -1;
    },

    /**
    * Returns the number of Milliseconds between the two dates
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Int} true number of minutes between the two dates
    * @static
    */
    getDurationInMilliseconds: function (start, end) {
        return (end - start);
    },

    /**
    * Returns the number of Seconds between the two dates
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Int} true number of minutes between the two dates
    * @static
    */
    getDurationInSeconds: function (start, end) {
        return (end - start) / 1000;
    },

    /**
    * Returns the number of minutes between the two dates
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Int} true number of minutes between the two dates
    * @static
    */
    getDurationInMinutes: function (start, end) {
        return (end - start) / 60000;
    },

    /**
    * Returns the number of hours between the two dates
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Int} true number of hours between the two dates
    * @static
    */
    getDurationInHours: function (start, end) {
        return (end - start) / 3600000;
    },

    /**
    * Returns the number of whole days between the two dates
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Int} true number of days between the two dates
    * @static
    */
    getDurationInDays: function (start, end) {
        return (end - start) / 86400000;
    },

    /**
    * Returns the number of business days between the two dates
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Int} true number of business days between the two dates
    * @static
    */
    getDurationInBusinessDays: function (start, end) {
        var nbrDays = Math.round((end - start) / 86400000),
            nbrBusinessDays = 0,
            d;

        for (var i = 0; i < nbrDays; i++) {
            d = this.add(start, this.DAY, i).getDay();
            if (d !== 6 && d !== 0) {
                nbrBusinessDays++;
            }
        }
        return nbrBusinessDays;
    },

    /**
    * Returns the number of whole months between the two dates
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Int} The number of whole months between the two dates
    * @static
    */
    getDurationInMonths: function (start, end) {
        return ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth());
    },

    /**
    * Returns the number of years between the two dates
    * @param {Date} start Start date
    * @param {Date} end End date
    * @return {Int} The number of whole months between the two dates
    * @static
    */
    getDurationInYears: function (start, end) {
        return this.getDurationInMonths(start, end) / 12;
    },

    /**
    * Returns the lesser of the two dates
    * @param {Date} date 1
    * @param {Date} date 2
    * @return {Date} Returns the lesser of the two dates
    * @static
    */
    min: function (d1, d2) {
        return d1 < d2 ? d1 : d2;
    },

    /**
    * Returns the greater of the two dates
    * @param {Date} date 1
    * @param {Date} date 2
    * @return {Date} Returns the greater of the two dates
    * @static
    */
    max: function (d1, d2) {
        return d1 > d2 ? d1 : d2;
    },

    /**
    * Returns true if dates intersect
    * @param {Date} start 1
    * @param {Date} end 1
    * @param {Date} start 2
    * @param {Date} end 2
    * @return {Boolean} Returns true if dates intersect
    * @static
    */
    intersectSpans: function (date1Start, date1End, date2Start, date2End) {
        return this.betweenLesser(date1Start, date2Start, date2End) ||
               this.betweenLesser(date2Start, date1Start, date1End);
    },
    
    /**
     * Returns a name of the duration unit, matching its property on the Sch.util.Date class. 
     * So, for example:
     * 
     *      Sch.util.Date.getNameOfUnit(Sch.util.Date.DAY) == 'DAY' // true
     * 
     * @static
     * @param {String} unit Duration unit
     * @return {String} 
     */
    getNameOfUnit : function (unit) {
        
        switch (unit.toLowerCase()) {
            case this.YEAR      : return 'YEAR';
            case this.QUARTER   : return 'QUARTER';
            case this.MONTH     : return 'MONTH';
            case this.WEEK      : return 'WEEK';
            case this.DAY       : return 'DAY';
            case this.HOUR      : return 'HOUR';
            case this.MINUTE    : return 'MINUTE';
            case this.SECOND    : return 'SECOND';
            case this.MILLI     : return 'MILLI';
        }
        
        throw "Incorrect UnitName";
    },
    
    
    /**
     * Returns a human-readable name of the duration unit. For for example for `Sch.util.Date.DAY` it will return either
     * "day" or "days", depending from the `plural` argument
     * @static
     * @param {String} unit Duration unit
     * @param {Boolean} plural Whether to return a plural name or singular
     * @return {String} 
     */
    getReadableNameOfUnit : function (unit, plural) {
        
        switch (unit.toLowerCase()) {
            case this.YEAR      : return plural ? 'years' : 'year';
            case this.QUARTER   : return plural ? 'quarters' : 'quarter';
            case this.MONTH     : return plural ? 'months' : 'month';
            case this.WEEK      : return plural ? 'weeks' : 'week';
            case this.DAY       : return plural ? 'days' : 'day';
            case this.HOUR      : return plural ? 'hours' : 'hour';
            case this.MINUTE    : return plural ? 'mins' : 'min';
            case this.SECOND    : return 'sec';
            case this.MILLI     : return 'ms';
        }
        
        throw "Incorrect UnitName";
    },
    
    
    getUnitByName : function (name) {
        name    = name.toUpperCase();
        
        if (!this[ name ]) {
            Ext.Error.raise('Unknown unit name');
        }
        
        return this[ name ];
    },
    
    
    /**
     * Returns the beginning of the Nth next duration unit, after the provided `date`.
     * For example for the this call:
     *      Sch.util.Date.getNext(new Date('Jul 15, 2011'), Sch.util.Date.MONTH, 1)
     *      
     * will return the beginning of the August: Aug 1, 2011     
     *      
     * @static
     * @param {Date} date The date
     * @param {String} unit The duration unit
     * @param {Integer} increment How many duration units to skip
     * @param {Number} weekStartDay An index of 1st day in week. Only required when `unit` is `WEEK`. 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on. 
     * @return {Date} The beginning of the next duration unit interval
     */
    getNext : function(date, unit, increment, weekStartDay) {
        var dt = Ext.Date.clone(date);
        
        increment = increment || 1;
        
        switch (unit) {
            case this.DAY: 
                Ext.Date.clearTime(dt);
                dt = this.add(dt, this.DAY, increment);
            break;

            case this.WEEK: 
                var day = dt.getDay();
                dt = this.add(dt, this.DAY, (7 * (increment - 1)) + (day < weekStartDay ? (weekStartDay - day) : (7 - day + weekStartDay)));
            break;

            case this.MONTH: 
                dt = this.add(dt, this.MONTH, increment);
                dt.setDate(1);
            break;

            case this.QUARTER:
                dt = this.add(dt, this.MONTH, ((increment - 1) * 3) + (3 - (dt.getMonth() % 3)));
            break;
            
            case this.YEAR:
                dt = new Date(dt.getFullYear() + increment, 0, 1);
            break;

            default:
                dt = this.add(date, unit, increment);
            break;
        }

        return dt;
    },

    getNumberOfMsFromTheStartOfDay : function (date) {
        return date - Ext.Date.clearTime(date, true) || 86400000;
    },
    
    getNumberOfMsTillTheEndOfDay : function (date) {
        return this.getStartOfNextDay(date, true) - date;
    },

    getStartOfNextDay : function (date, clone) {
        var nextDay     = this.add(Ext.Date.clearTime(date, clone), this.DAY, 1);
        
        // DST case
        if (nextDay.getDate() == date.getDate()) {
            var offsetNextDay   = this.add(Ext.Date.clearTime(date, clone), this.DAY, 2).getTimezoneOffset();
            var offsetDate      = date.getTimezoneOffset();
            
            nextDay             = this.add(nextDay, this.MINUTE, offsetDate - offsetNextDay);
        }
        
        return nextDay;
    },

    getEndOfPreviousDay : function (date) {
        var dateOnly    = Ext.Date.clearTime(date, true);
        
        // dates are different
        if (dateOnly - date) {
            return dateOnly;
        } else {
            return this.add(dateOnly, this.DAY, -1);
        }
    }
});


/*
 * To analyze possible errors in your setup, include this on your HTML page and use Firebug (or any other console application) to execute line below:
 * >
 * > Sch.util.Debug.runDiagnostics();
 * > ...
 */ 
Ext.define("Sch.util.Debug", {
    singleton : true,

    runDiagnostics : function() {
        var log;
        if (console && console.log) {
            log = console.log;
        } else {
            if (!window.schedulerDebugWin) {
                window.schedulerDebugWin = new Ext.Window({
                    height:400,
                    width: 500,
                    bodyStyle:'padding:10px',
                    closeAction : 'hide',
                    autoScroll:true
                });
            }
            window.schedulerDebugWin.show();
            schedulerDebugWin.update('');
            log = function(text){ schedulerDebugWin.update((schedulerDebugWin.body.dom.innerHTML || '') + text + '<br/>');};
        }

        var els = Ext.select('.sch-schedulerpanel');
    
        if (els.getCount() === 0) log('No scheduler component found');
    
        var s = Ext.getCmp(els.elements[0].id),
            resourceStore = s.getResourceStore(),
            eventStore = s.getEventStore();

        log('Scheduler view start: ' + s.getStart() + ', end: ' + s.getEnd());
    
        if (!resourceStore) { log('No store configured'); return; }
        if (!eventStore) {log('No event store configured'); return; }
    
        log(resourceStore.getCount() + ' records in the resource store'); 
        log(eventStore.getCount() + ' records in the eventStore'); 
        var eventIdProp = eventStore.model.prototype.idProperty;
        var resourceIdProp = resourceStore.model.prototype.idProperty;

        var eventIdPropertyFound = eventStore.model.prototype.fields.getByKey(eventIdProp);
        var resourceIdPropertyFound = resourceStore.model.prototype.fields.getByKey(resourceIdProp);

        if (!(eventStore.model.prototype instanceof Sch.model.Event)) {
            log("Your event model must extend Sch.model.Event"); 
        }
        if (!(resourceStore.model.prototype instanceof Sch.model.Resource)) {
            log("Your event model must extend Sch.model.Resource"); 
        }

        if (!eventIdPropertyFound) {
            log("idProperty on the event model is incorrectly setup, value: " + eventIdProp); 
        }
        if (!resourceIdPropertyFound) {
            log("idProperty on the resource model is incorrectly setup, value: " + resourceIdProp); 
        }

        var view = s.getSchedulingView();

        log(view.el.select(view.eventSelector).getCount() + ' events present in the DOM'); 
    
        if (eventStore.getCount() > 0) {
            if (!eventStore.first().getStartDate() || !(eventStore.first().getStartDate() instanceof Date)) {
                log ('The eventStore reader is misconfigured - The StartDate field is not setup correctly, please investigate');
                log('StartDate is configured with dateFormat: ' + eventStore.model.prototype.fields.getByKey('StartDate').dateFormat);
                log('See Ext JS docs for information about different date formats: http://docs.sencha.com/ext-js/4-0/#!/api/Ext.Date');

                return;
            }
        
            if (!eventStore.first().getEndDate() || !(eventStore.first().getEndDate() instanceof Date)) {
                log('The eventStore reader is misconfigured - The EndDate field is not setup correctly, please investigate');
                log('EndDate is configured with dateFormat: ' + eventStore.model.prototype.fields.getByKey('EndDate').dateFormat);
                log('See Ext JS docs for information about different date formats: http://docs.sencha.com/ext-js/4-0/#!/api/Ext.Date');
                return;
            }
        
            log('Records in the event store:');
            eventStore.each(function(r, i) {
                log((i + 1) + '. Start:' + r.getStartDate() + ', End:' + r.getEndDate() + ', ResourceId:' + r.getResource().get('Id'));
            });
        } else {
            log('Event store has no data. Has it been loaded properly?');
        }
    
        if (resourceStore.getCount() > 0) {
            log('Records in the resource store:');
            resourceStore.each(function(r, i) {
                log((i + 1) + '. Id:' + r.get('Id'));
                return;
            });
        } else {
            log('Resource store has no data.');
            return;
        }
    
        log('Everything seems to be setup ok!');
    }    
});

/**
@class Sch.util.HeaderRenderers
@static
 
A utility class for providing helper methods used to render header cells. These helpers can be used to "emulate" fine grained views with higher resolution.

Normally, each unit in the time axis is represented with a separate column. This is a very flexible solution, as it allows you to customize the presentation
of each and every cell in the timeline. However, when the number of columns grows, the DOM footprint becomes larger and larger.
So in cases when the customization of an arbitrary cell is not required, you can use one of these lightweight renderers to only visualize the small time units in the header.

For example, see this screenshot: {@img scheduler/images/header-renderer2.png}

It might seem that it uses a single day resolution. However, it uses "weeks" for both bottom and middle rows and for bottom row it uses
the `dayLetter` header renderer (see the `weekAndDayLetter` view preset).

To use the helper, specify the it as the `renderer` property of the {@link Sch.preset.ViewPresetHeaderRow}, like this:

    headerConfig : {
         bottom         : {
            unit        : "WEEK",
            increment   : 1,
            renderer    : function() {
                return Sch.util.HeaderRenderers.dayLetter.apply(this, arguments);
            }
        },
        middle : {
            unit        : "WEEK",
            dateFormat  : 'D d M Y',
            align       : 'left'
        }
    }

Available helpers are:

- `quarterMinute` - outputs the quarter of the minute or hour: 00 / 15 / 30 / 45
- `dateNumber` - outputs the the number of day: {@img scheduler/images/dateNumber.png}
- `dayLetter` - outputs the single letter name for each day: {@img scheduler/images/header-renderer2.png}
- `dayStartEndHours` - outputs the start and end hours for each date {@img scheduler/images/header-renderer1.png}

There's also a special "meta" helper, which when being called, will return a usual helper, suitable for usage as `renderer`. Its called `dateCells` and accepths the following signature:

    dateCells : function(unit, increment, format) {}

So, for example a `dateNumber` helper can be received by using: `dateCells(Sch.util.Date.DAY, 1, 'd')`

*/ 
Ext.define("Sch.util.HeaderRenderers", {
    singleton : true,
    requires : [
        'Sch.util.Date',
        'Ext.XTemplate'
    ],
    constructor : function () {
        var dayTemplate = Ext.create("Ext.XTemplate", 
            '<table class="sch-nested-hdr-tbl ' + Ext.baseCSSPrefix + 'column-header-text' + '" cellpadding="0" cellspacing="0"><tr>' + 
                '<tpl for="."><td style="width:{[100/xcount]}%" class="{cls} sch-dayheadercell-{dayOfWeek}">{text}</td></tpl>' + 
            '</tr></table>'
        ).compile();
    
        var cellTemplate = Ext.create("Ext.XTemplate", 
            '<table class="sch-nested-hdr-tbl" cellpadding="0" cellspacing="0"><tr>' + 
                '<tpl for="."><td style="width:{[100/xcount]}%" class="{cls}">{text}</td></tpl>' + 
            '</tr></table>'
        ).compile();

        return {
            quarterMinute : function(start, end, cfg, i) {
                cfg.headerCls = 'sch-nested-hdr-pad';
                return '<table class="sch-nested-hdr-tbl" cellpadding="0" cellspacing="0"><tr><td>00</td><td>15</td><td>30</td><td>45</td></tr></table>';
            },

            dateCells : function(unit, increment, format) {
            
                return function(start, end, cfg) {
                    cfg.headerCls = 'sch-nested-hdr-nopad';
                
                    var vals = [],
                        dt = Ext.Date.clone(start);
                
                    while(dt < end) {
                        vals.push({
                            text : Ext.Date.format(dt, format)
                        });
                        dt = Sch.util.Date.add(dt, unit, increment);
                    }

                    vals[0].cls = 'sch-nested-hdr-cell-first';
                    vals[vals.length - 1].cls = 'sch-nested-hdr-cell-last';
                
                    return cellTemplate.apply(vals);
                };
            },

            dateNumber : function(start, end, cfg) {
                cfg.headerCls = 'sch-nested-hdr-nopad';
                var vals = [],
                    dt = Ext.Date.clone(start);
                
                while(dt < end) {
                    vals.push({
                        dayOfWeek : dt.getDay(),
                        text : dt.getDate()
                    });
                    dt = Sch.util.Date.add(dt, Sch.util.Date.DAY, 1);
                }
                
                return dayTemplate.apply(vals);
            },

            dayLetter : function(start, end, cfg) {
                cfg.headerCls = 'sch-nested-hdr-nopad';
                var vals = [],
                    dt = start;
                
                while(dt < end) {
                    vals.push({
                        dayOfWeek : dt.getDay(),
                        text : Ext.Date.dayNames[dt.getDay()].substr(0, 1)
                    });
                    dt = Sch.util.Date.add(dt, Sch.util.Date.DAY, 1);
                }
                vals[0].cls = 'sch-nested-hdr-cell-first';
                vals[vals.length - 1].cls = 'sch-nested-hdr-cell-last';
                
                return dayTemplate.apply(vals);
            },

            dayStartEndHours : function(start, end, cfg) {
                cfg.headerCls = 'sch-hdr-startend';
                return Ext.String.format('<span class="sch-hdr-start">{0}</span><span class="sch-hdr-end">{1}</span>', Ext.Date.format(start, 'G'), Ext.Date.format(end, 'G'));            
            }
        };
    }
});

/*
 * @class Sch.util.DragTracker
 * @private
 * 
 * Simple drag tracker with an extra useful getRegion method
 */
Ext.define('Sch.util.DragTracker', {
    extend      : 'Ext.dd.DragTracker',
    
    /**
     * @cfg {Number} xStep
     * The number of horizontal pixels to snap to when dragging
     */
    xStep : 1,

    /**
     * @cfg {Number} yStep
     * The number of vertical pixels to snap to when dragging
     */
    yStep : 1,

    /**
     * Set the number of horizontal pixels to snap to when dragging
     * @param {Number} step
     */
    setXStep : function(step) {
        this.xStep = step;
    },

    /**
     * Set the number of vertical pixels to snap to when dragging
     * @param {Number} step
     */
    setYStep : function(step) {
        this.yStep = step;
    },

    getRegion : function() {
        var startXY   = this.startXY,
            currentXY = this.getXY(),
            minX      = Math.min(startXY[0], currentXY[0]),
            minY      = Math.min(startXY[1], currentXY[1]),
            width     = Math.abs(startXY[0] - currentXY[0]),
            height    = Math.abs(startXY[1] - currentXY[1]);
            
        return new Ext.util.Region(minY, minX + width, minY + height, minX);
    },

    onMouseDown: function(e, target){
        // If this is disabled, or the mousedown has been processed by an upstream DragTracker, return
        if (this.disabled ||e.dragTracked) {
            return;
        }

        var xy = e.getXY(),
            elX, elY,
            x = xy[0], 
            y = xy[1];
        // TODO handle if this.el is scrolled
        if (this.xStep > 1) {
            elX = this.el.getX();
            x -= elX;
            x = Math.round(x/this.xStep)*this.xStep;
            x += elX;
        }
        
        if (this.yStep > 1) {
            elY = this.el.getY();
            y -= elY;
            y = Math.round(y/this.yStep)*this.yStep;
            y += elY;
        }

        // This information should be available in mousedown listener and onBeforeStart implementations
        this.dragTarget = this.delegate ? target : this.handle.dom;
        this.startXY = this.lastXY = [x, y];
        this.startRegion = Ext.fly(this.dragTarget).getRegion();

        if (this.fireEvent('mousedown', this, e) === false ||
            this.fireEvent('beforedragstart', this, e) === false ||
            this.onBeforeStart(e) === false) {
            return;
        }

        // Track when the mouse is down so that mouseouts while the mouse is down are not processed.
        // The onMouseOut method will only ever be called after mouseup.
        this.mouseIsDown = true;

        // Flag for downstream DragTracker instances that the mouse is being tracked.
        e.dragTracked = true;

        if (this.preventDefault !== false) {
            e.preventDefault();
        }
        Ext.getDoc().on({
            scope: this,
            mouseup: this.onMouseUp,
            mousemove: this.onMouseMove,
            selectstart: this.stopSelect
        });
        if (this.autoStart) {
            this.timer =  Ext.defer(this.triggerStart, this.autoStart === true ? 1000 : this.autoStart, this, [e]);
        }
    },

    onMouseMove: function(e, target){
        
        if (this.active && Ext.isIE && !e.browserEvent.button) {
            e.preventDefault();
            this.onMouseUp(e);
            return;
        }

        e.preventDefault();
        var xy = e.getXY(),
            s = this.startXY;
        
        if (!this.active) {
            if (Math.max(Math.abs(s[0]-xy[0]), Math.abs(s[1]-xy[1])) > this.tolerance) {
                this.triggerStart(e);
            } else {
                return;
            }
        }

        var x = xy[0], 
            y = xy[1];
        
        // TODO handle if this.el is scrolled
        if (this.xStep > 1) {
            x -= this.startXY[0];
            x = Math.round(x/this.xStep)*this.xStep;
            x += this.startXY[0];
        }
        
        if (this.yStep > 1) {
            y -= this.startXY[1];
            y = Math.round(y/this.yStep)*this.yStep;
            y += this.startXY[1];
        }

        var snapping = this.xStep > 1 || this.yStep > 1;

        if (!snapping || x !== xy[0] || y !== xy[1]) {
            this.lastXY = [x,y];
        
            if (this.fireEvent('mousemove', this, e) === false) {
                this.onMouseUp(e);
            } else {
                this.onDrag(e);
                this.fireEvent('drag', this, e);
            }
        }
    }
});

/**
@class Sch.preset.Manager
@singleton

Provides a registry of the possible view presets that any instance of an grid with {@link Sch.mixin.SchedulerPanel} mixin can use.

See the {@link Sch.preset.ViewPreset}, {@link Sch.preset.ViewPresetHeaderRow} and {@link Sch.util.HeaderRenderers} for description of the view preset properties.

Available presets are:

- `hourAndDay` - creates 2 level headers - day and hours within it: {@img scheduler/images/hourAndDay.png} 
- `dayAndWeek` - creates 2 level headers - week and days within it: {@img scheduler/images/dayAndWeek.png} 
- `weekAndDay` - just like `dayAndWeek` but with different formatting: {@img scheduler/images/weekAndDay.png} 
- `weekAndMonth` - creates 2 level headers - month and weeks within it: {@img scheduler/images/weekAndMonth.png}

- `monthAndYear` - creates 2 level headers - year and months within it: {@img scheduler/images/monthAndYear.png}
- `year` - creates 2 level headers - year and quarters within it: {@img scheduler/images/year-preset.png}
- `weekAndDayLetter` - creates a lightweight 2 level headers - weeks and days within it (days are not real columns). 
   See {@link Sch.util.HeaderRenderers} for details. {@img scheduler/images/header-renderer2.png}
- `weekDateAndMonth` - creates 2 level headers - month and weeks within it (weeks shown by first day only): {@img scheduler/images/weekDateAndMonth.png}

You can register your own preset with the {@link #registerPreset} call 

*/
 
Ext.define('Sch.preset.Manager', {
    extend: 'Ext.util.MixedCollection',
    requires: [
        'Sch.util.Date',
        'Sch.util.HeaderRenderers'
    ],
    singleton: true,

    constructor : function() {
        this.callParent(arguments);
        this.registerDefaults();
    },
    
    /**
    * Registers a new view preset to be used by any scheduler grid or tree on the page.
    * @param {String} name The unique name identifying this preset
    * @param {Object} config The configuration properties of the view preset (see {@link Sch.preset.ViewPreset} for more information)
    */
    registerPreset : function(name, cfg) {
        if (cfg) {
            var headerConfig    = cfg.headerConfig;
            var DATE            = Sch.util.Date;
            
            // Make sure date "unit" constant specified in the preset are resolved
            for (var o in headerConfig) {
                if (headerConfig.hasOwnProperty(o)) {
                    if (DATE[headerConfig[o].unit]) {
                        headerConfig[o].unit = DATE[headerConfig[o].unit.toUpperCase()];
                    }
                }
            }
            
            if (!cfg.timeColumnWidth) {
                cfg.timeColumnWidth = 50;
            }

            // Resolve date units
            if (cfg.timeResolution && DATE[cfg.timeResolution.unit]) {
                cfg.timeResolution.unit = DATE[cfg.timeResolution.unit.toUpperCase()];
            }

            // Resolve date units
            if (cfg.shiftUnit && DATE[cfg.shiftUnit]) {
                cfg.shiftUnit = DATE[cfg.shiftUnit.toUpperCase()];
            }
        }
        
        if (this.isValidPreset(cfg)) {
            if (this.containsKey(name)){
                this.removeAtKey(name);
            }
            this.add(name, cfg);
        } else {
            throw 'Invalid preset, please check your configuration';
        }
    },

    isValidPreset : function(cfg) {
        var D = Sch.util.Date,
            valid = true,
            validUnits = [D.MILLI, D.SECOND, D.MINUTE, D.HOUR, D.DAY, D.WEEK, D.MONTH, D.QUARTER, D.YEAR];

        // Make sure all date "unit" constants are valid
        for (var o in cfg.headerConfig) {
            if (cfg.headerConfig.hasOwnProperty(o)) {
                valid = valid && Ext.Array.indexOf(validUnits, cfg.headerConfig[o].unit) >= 0;
            }
        }

        if (cfg.timeResolution) {
            valid = valid && Ext.Array.indexOf(validUnits, cfg.timeResolution.unit) >= 0;
        }

        if (cfg.shiftUnit) {
            valid = valid && Ext.Array.indexOf(validUnits, cfg.shiftUnit) >= 0;
        }

        return valid;
    },

    /**
    * Fetches a view preset from the global cache
    * @param {String} name The name of the preset
    * @return {Object} The view preset, see {@link Sch.preset.ViewPreset} for more information
    */
    getPreset : function(name) {
        return this.get(name);
    },

    /**
    * Deletes a view preset 
    * @param {String} name The name of the preset
    */
    deletePreset : function(name) {
        this.removeAtKey(name);
    },

    registerDefaults : function() {
        var pm = this,
            vp = this.defaultPresets;

        for (var p in vp) {
            pm.registerPreset(p, vp[p]);
        }
    },

    defaultPresets : {
        hourAndDay : {
            timeColumnWidth : 60,   // Time column width (used for rowHeight in vertical mode)
            rowHeight: 24,          // Only used in horizontal orientation
            resourceColumnWidth : 100,  // Only used in vertical orientation
            displayDateFormat : 'G:i',  // Controls how dates will be displayed in tooltips etc
            shiftIncrement : 1,     // Controls how much time to skip when calling shiftNext and shiftPrevious.
            shiftUnit : "DAY",      // Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
            defaultSpan : 12,       // By default, if no end date is supplied to a view it will show 12 hours
            timeResolution : {      // Dates will be snapped to this resolution
                unit : "MINUTE",    // Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
                increment : 15
            },
            headerConfig : {    // This defines your header, you must include a "middle" object, and top/bottom are optional. For each row you can define "unit", "increment", "dateFormat", "renderer", "align", and "scope"
                middle : {              
                    unit : "HOUR",
                    dateFormat : 'G:i'
                },
                top : {
                    unit : "DAY",
                    dateFormat : 'D d/m'
                }
            }
        },
        dayAndWeek : {
            timeColumnWidth : 100,
            rowHeight: 24,          // Only used in horizontal orientation
            resourceColumnWidth : 100,  // Only used in vertical orientation
            displayDateFormat : 'Y-m-d G:i',
            shiftUnit : "DAY",
            shiftIncrement : 1,
            defaultSpan : 5,       // By default, show 5 days
            timeResolution : {
                unit : "HOUR",
                increment : 1
            },
            headerConfig : {
                middle : {
                    unit : "DAY",
                    dateFormat : 'D d M'
                },
                top : {
                    unit : "WEEK",
                    renderer : function(start, end, cfg) {
                        return 'w.' + Ext.Date.format(start, 'W M Y');
                    }
                }
            }
        },

        weekAndDay : {
            timeColumnWidth : 100,
            rowHeight: 24,          // Only used in horizontal orientation
            resourceColumnWidth : 100,  // Only used in vertical orientation
            displayDateFormat : 'Y-m-d',
            shiftUnit : "WEEK",
            shiftIncrement : 1,
            defaultSpan : 1,       // By default, show 1 week
            timeResolution : {
                unit : "DAY",
                increment : 1
            },
            headerConfig : {
                 bottom : {
                    unit : "DAY",
                    increment : 1,
                    dateFormat : 'd/m'
                },
                middle : {
                    unit : "WEEK",
                    dateFormat : 'D d M',
                    align : 'left'
                }
            }
        },

        weekAndMonth : {
            timeColumnWidth : 100,
            rowHeight: 24,          // Only used in horizontal orientation
            resourceColumnWidth : 100,  // Only used in vertical orientation
            displayDateFormat : 'Y-m-d',
            shiftUnit : "WEEK",
            shiftIncrement : 5,
            defaultSpan : 6,       // By default, show 6 weeks
            timeResolution : {
                unit : "DAY",
                increment : 1
            },
            headerConfig : {
                middle : {
                    unit : "WEEK",
                    renderer : function(start, end, cfg) {
                        cfg.align = 'left';
                        return Ext.Date.format(start, 'd M');
                    }
                },
                top : {
                    unit : "MONTH",
                    dateFormat : 'M Y'
                }
            }
        },

        monthAndYear : {
            timeColumnWidth : 110,
            rowHeight: 24,          // Only used in horizontal orientation
            resourceColumnWidth : 100,  // Only used in vertical orientation
            displayDateFormat : 'Y-m-d',
            shiftIncrement : 3,
            shiftUnit : "MONTH",
            defaultSpan : 12,       // By default, show 12 months
            timeResolution : {
                unit : "DAY",
                increment : 1
            },
            headerConfig : {
                middle : {
                    unit : "MONTH",
                    dateFormat : 'M Y'
                },
                top : {
                    unit : "YEAR",
                    dateFormat : 'Y'
                }
            }
        },
        year : {
            timeColumnWidth : 100,
            rowHeight: 24,          // Only used in horizontal orientation
            resourceColumnWidth : 100,  // Only used in vertical orientation
            displayDateFormat : 'Y-m-d',
            shiftUnit : "YEAR",
            shiftIncrement : 1,
            defaultSpan : 1,       // By default, show 1 year
            timeResolution : {
                unit : "MONTH",
                increment : 1
            },
            headerConfig : {
                bottom : {
                    unit : "QUARTER",
                    renderer : function(start, end, cfg) {
                        return Ext.String.format('Q{0}', Math.floor(start.getMonth() / 3) + 1);
                    }
                },
                middle : {
                    unit : "YEAR",
                    dateFormat : 'Y'
                }
            }
        },
        weekAndDayLetter : {
            timeColumnWidth : 140,
            rowHeight: 24,          // Only used in horizontal orientation
            resourceColumnWidth : 100,  // Only used in vertical orientation
            displayDateFormat : 'Y-m-d',
            shiftUnit : "WEEK",
            shiftIncrement : 1,
            defaultSpan : 10,       // By default, show 10 weeks
            timeResolution : {
                unit : "DAY",
                increment : 1
            },
            headerConfig : {
                 bottom : {
                    unit : "WEEK",
                    increment : 1,
                    renderer : function() {
                        return Sch.util.HeaderRenderers.dayLetter.apply(this, arguments);
                    }
                },
                middle : {
                    unit : "WEEK",
                    dateFormat : 'D d M Y',
                    align : 'left'
                }
            }
        },
        weekDateAndMonth : {
            timeColumnWidth : 30,
            rowHeight: 24,          // Only used in horizontal orientation
            resourceColumnWidth : 100,  // Only used in vertical orientation
            displayDateFormat : 'Y-m-d',
            shiftUnit : "WEEK",
            shiftIncrement : 1,
            defaultSpan : 10,       // By default, show 10 weeks
            timeResolution : {
                unit : "DAY",
                increment : 1
            },
            headerConfig : {
                 middle : {
                    unit : "WEEK",
                    dateFormat : 'd'
                },
                top : {
                    unit : "MONTH",
                    dateFormat : 'Y F',
                    align : 'left'
                }
            }
        }
    }
}); 

/**
@class Sch.preset.ViewPreset
Not used directly, but the properties below are rather provided inline as seen in the source of {@link Sch.preset.Manager}. This class is just provided for documentation purposes.

A sample preset looks like:

        hourAndDay : {
            timeColumnWidth         : 60,       // Time column width (used for rowHeight in vertical mode)
            rowHeight               : 24,       // Only used in horizontal orientation
            resourceColumnWidth     : 100,      // Only used in vertical orientation
            
            displayDateFormat       : 'G:i',    // Controls how dates will be displayed in tooltips etc
            
            shiftIncrement          : 1,        // Controls how much time to skip when calling shiftNext and shiftPrevious.
            shiftUnit               : "DAY",    // Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
            defaultSpan             : 12,       // By default, if no end date is supplied to a view it will show 12 hours
            
            timeResolution          : {         // Dates will be snapped to this resolution
                unit        : "MINUTE",         // Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
                increment   : 15
            },
            
            headerConfig            : {         // This defines your header, you must include a "middle" object, and top/bottom are optional. 
                middle      : {                 // For each row you can define "unit", "increment", "dateFormat", "renderer", "align", and "scope"
                    unit        : "HOUR",
                    dateFormat  : 'G:i'
                },
                top         : {
                    unit        : "DAY",
                    dateFormat  : 'D d/m'
                }
            }
        },

See the {@link Sch.preset.Manager} for the list of available presets.
 
*/
Ext.define("Sch.preset.ViewPreset", {
    /**
    * @cfg {Int} timeColumnWidth The column width 
    */
    
    /**
    * @cfg {Int} rowHeight The height of the row 
    */
    
    /**
    * @cfg {Int} resourceColumnWidth The width of the resource column (only being used in vertical orientation) 
    */
    
    /**
    * @cfg {String} displayDateFormat Defines how dates will be formatted in tooltips etc
    */
    
    /**
    * @cfg {String} shiftUnit The unit to shift when calling shiftNext/shiftPrevious to navigate in the chart. 
    * Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
    */
    
    /**
    * @cfg {Int} shiftIncrement The amount to shift (in shiftUnits)
    */
    
    /**
    * @cfg {Int} defaultSpan The amount of time to show by default in a view (in the unit defined by the middle header)
    */
    
    /**
    * @cfg {Object} timeResolution An object containing a unit identifier and an increment variable. Example:
    * 
        timeResolution : {
            unit        : "HOUR",  //Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
            increment   : 1
        }
    * 
    */

    /**
    * @cfg {Object} headerConfig An object containing one or more {@link Sch.preset.ViewPresetHeaderRow} rows defining how your headers shall be composed. 
    * Your 'main' unit should be the middle header unit. This object can contain "bottom", "middle" and "top" header definitions. The 'middle' header is mandatory.
    */
});


/**
@class Sch.preset.ViewPresetHeaderRow

A part of {@link Sch.preset.ViewPreset} declaration. Not used directly, but the properties below are rather provided 
inline as seen in sources of {@link Sch.preset.Manager}. This class is just provided for documentation purposes.

A sample header configuration will looks like: 

        headerConfig    : {
             bottom     : {
                unit        : "WEEK",
                increment   : 1,
                renderer    : function() {
                    return Sch.util.HeaderRenderers.dayLetter.apply(this, arguments);
                }
            },
            middle : {
                unit        : "WEEK",
                dateFormat  : 'D d M Y',
                align       : 'left'
            }
        }

*/
Ext.define("Sch.preset.ViewPresetHeaderRow", {
    /**
    * @cfg {String} unit The unit of time represented by each cell in this header row. See also increment property. 
    * Valid values are "MILLI", "SECOND", "MINUTE", "HOUR", "DAY", "WEEK", "MONTH", "QUARTER", "YEAR".
    */

    /**
    * @cfg {Int} increment The number of units each header cell will represent (e.g. 30 together with unit: "MINUTE" for 30 minute cells)
    */

    /**
    * @cfg {String} dateFormat Defines how the cell date will be formatted 
    */

    /**
    * @cfg {Function} renderer A custom renderer function used to render the cell contents. 
    * The render function is called with the following parameters:
    * 
    * - `startDate` : Date - The start date of the cell.
    * - `endDate` : Date - The end date of the cell
    * - `headerConfig` : Object - An object containing the header config object. You can set 'align' (for text-align) and headerCls (a CSS class added to the cell) properties on it.
    * - `i` : Int - The index of the cell in the row.
    * 
    * Example : 

    function (startDate, endDate, headerConfig, i) {
        headerConfig.align = "left";
    }

    */

    /**
    * @cfg {Object} scope The scope to use for the renderer function
    */

    /**
    * @cfg {Function} cellGenerator A function that should return an array of objects containing 'start', 'end' and 'header' properties. 
    * Use this if you want full control over how the header rows are generated. This is not applicable for the lowest row in your configuration. 
    */
});


/*
 * A copy of Ext.grid.PagingScroller which always uses the own store reference (not from panel/view) 
 * 
 * @class Sch.scroller.Paging
 * @extends Ext.grid.Scroller
 *
 * @private
 */
Ext.define('Sch.scroller.Paging', {
    extend      : 'Ext.grid.Scroller',
    alias       : 'widget.schpagingscroller',
    
    //renderTpl: null,
    //tpl: [
    //    '<tpl for="pages">',
    //        '<div class="' + Ext.baseCSSPrefix + 'stretcher" style="width: {width}px;height: {height}px;"></div>',
    //    '</tpl>'
    //],
    
    /**
     * @cfg {Number} percentageFromEdge This is a number above 0 and less than 1 which specifies
     * at what percentage to begin fetching the next page. For example if the pageSize is 100
     * and the percentageFromEdge is the default of 0.35, the paging scroller will prefetch pages
     * when scrolling up between records 0 and 34 and when scrolling down between records 65 and 99.
     */
    percentageFromEdge: 0.35,

    /**
     * @cfg {Number} scrollToLoadBuffer This is the time in milliseconds to buffer load requests
     * when scrolling the PagingScrollbar.
     */
    scrollToLoadBuffer: 200,

    activePrefetch: true,

    chunkSize: 50,
    // FIX for #80
    snapIncrement: 1,
    // FIX for #80

    syncScroll: true,

    initComponent: function() {
        var me = this,
            ds = me.store;

        ds.on('guaranteedrange', this.onGuaranteedRange, this);
        this.callParent(arguments);
    },

    onGuaranteedRange: function(range, start, end) {
        var me = this,
            ds = me.store,
            rs;
        // this should never happen
        if (range.length && me.visibleStart < range[0].index) {
            return;
        }

        ds.loadRecords(range);
        
        // HACK: letting the others know that new portion of records were loaded
        ds.fireEvent('bufferchange', ds, range, start, end, this);
        // EOF HACK

        if (!me.firstLoad) {
            if (me.rendered) {
                me.invalidate();
            } else {
                me.on('afterrender', this.invalidate, this, {single: true});
            }
            me.firstLoad = true;
        } else {
            // adjust to visible
            me.syncTo();
        }
    },

    syncTo: function() {
        if (!this.rendered) return;
        
        var me            = this,
            pnl           = me.getPanel(),
            store         = this.store,
            scrollerElDom = this.scrollEl.dom,
            rowOffset     = me.visibleStart - store.guaranteedStart,
            scrollBy      = rowOffset * me.rowHeight,
            scrollHeight  = scrollerElDom.scrollHeight,
            clientHeight  = scrollerElDom.clientHeight,
            scrollTop     = scrollerElDom.scrollTop,
            useMaximum;

        // BrowserBug: clientHeight reports 0 in IE9 StrictMode
        // Instead we are using offsetHeight and hardcoding borders
        if (Ext.isIE9 && Ext.isStrict) {
            clientHeight = scrollerElDom.offsetHeight + 2;
        }

        // This should always be zero or greater than zero but staying
        // safe and less than 0 we'll scroll to the bottom.
        useMaximum = (scrollHeight - clientHeight - scrollTop <= 0);
        this.setViewScrollTop(scrollBy, useMaximum);
    },

    getPageData : function(){
        var panel = this.getPanel(),
            store = this.store,
            totalCount = store.getTotalCount();

        return {
            total : totalCount,
            currentPage : store.currentPage,
            pageCount: Math.ceil(totalCount / store.pageSize),
            fromRecord: ((store.currentPage - 1) * store.pageSize) + 1,
            toRecord: Math.min(store.currentPage * store.pageSize, totalCount)
        };
    },

    onElScroll: function(e, t) {
        var me = this,
            panel = me.getPanel(),
            store = this.store,
            pageSize = store.pageSize,
            guaranteedStart = store.guaranteedStart,
            guaranteedEnd = store.guaranteedEnd,
            totalCount = store.getTotalCount(),
            numFromEdge = Math.ceil(me.percentageFromEdge * store.pageSize),
            position = t.scrollTop,
            visibleStart = Math.floor(position / me.rowHeight),
            view = panel.down('tableview'),
            viewEl = view.el,
            visibleHeight = viewEl.getHeight(),
            visibleAhead = Math.ceil(visibleHeight / me.rowHeight),
            visibleEnd = visibleStart + visibleAhead,
            prevPage = Math.floor(visibleStart / store.pageSize),
            nextPage = Math.floor(visibleEnd / store.pageSize) + 2,
            lastPage = Math.ceil(totalCount / store.pageSize),
            //requestStart = visibleStart,
            requestStart = Math.floor(visibleStart / me.snapIncrement) * me.snapIncrement,
            requestEnd = requestStart + pageSize - 1,
            activePrefetch = me.activePrefetch;

        me.visibleStart = visibleStart;
        me.visibleEnd = visibleEnd;
        
        me.syncScroll = true;
        if (totalCount >= pageSize) {
            // end of request was past what the total is, grab from the end back a pageSize
            if (requestEnd > totalCount - 1) {
                this.cancelLoad();
                if (store.rangeSatisfied(totalCount - pageSize, totalCount - 1)) {
                    me.syncScroll = true;
                }
                store.guaranteeRange(totalCount - pageSize, totalCount - 1);
            // Out of range, need to reset the current data set
            } else if (visibleStart < guaranteedStart || visibleEnd > guaranteedEnd) {
                if (store.rangeSatisfied(requestStart, requestEnd)) {
                    this.cancelLoad();
                    
                    // FIX for #80
                    // if the `requestStart/requestEnd` matches the current `guaranteedStart/guaranteedEnd`
                    // the store will not fire `guaranteedrange` event, thus `syncTo` will not be called
                    delete store.guaranteedStart;
                    delete store.guaranteedEnd;
                    // FIX 
                    
                    store.guaranteeRange(requestStart, requestEnd);
                } else {
                    store.mask();
                    me.attemptLoad(requestStart, requestEnd);
                }
                // dont sync the scroll view immediately, sync after the range has been guaranteed
                me.syncScroll = false;
            } else if (activePrefetch && visibleStart < (guaranteedStart + numFromEdge) && prevPage > 0) {
                me.syncScroll = true;
                store.prefetchPage(prevPage);
            } else if (activePrefetch && visibleEnd > (guaranteedEnd - numFromEdge) && nextPage < lastPage) {
                me.syncScroll = true;
                store.prefetchPage(nextPage);
            }
        }
        
        if (me.syncScroll) {
            me.syncTo();
        }
    },

    getSizeCalculation: function() {
        // Use the direct ownerCt here rather than the scrollerOwner
        // because we are calculating widths/heights.
        var owner = this.ownerGrid,
            view   = owner.getView(),
            store  = this.store,
            dock   = this.dock,
            elDom  = this.el.dom,
            width  = 1,
            height = 1;

        if (!this.rowHeight) {
             // <FIX> prevent accessing a non-existing row element if no rows exist yet
            var firstRow = view.el.down(view.getItemSelector());
            if (firstRow) {
                this.rowHeight = firstRow.getHeight(false, true);
            } else {
                // No rows rendered yet
                return {
                    width: 1,
                    height: 1
                };
            }
        }

        // If the Store is *locally* filtered, use the filtered count from getCount.
        height = store[(!store.remoteFilter && store.isFiltered()) ? 'getCount' : 'getTotalCount']() * this.rowHeight;

        if (isNaN(width)) {
            width = 1;
        }
        if (isNaN(height)) {
            height = 1;
        }
        return {
            width: width,
            height: height
        };
    },

    attemptLoad: function(start, end) {
        var me = this;
        if (!me.loadTask) {
            me.loadTask = Ext.create('Ext.util.DelayedTask', me.doAttemptLoad, me, []);
        }
        me.loadTask.delay(me.scrollToLoadBuffer, me.doAttemptLoad, me, [start, end]);
    },

    cancelLoad: function() {
        if (this.loadTask) {
            this.loadTask.cancel();
        }
    },

    doAttemptLoad:  function(start, end) {
        var store = this.store;
        store.guaranteeRange(start, end);
    },

    setViewScrollTop: function(scrollTop, useMax) {
        var owner = this.getPanel(),
            items = owner.query('tableview'),
            i = 0,
            len = items.length,
            center,
            centerEl,
            calcScrollTop,
            maxScrollTop,
            scrollerElDom = this.el.dom;
            
        var store   = this.store;

        owner.virtualScrollTop = scrollTop;

        center = items[1] || items[0];
        centerEl = center.el.dom;

        maxScrollTop = ((store.pageSize * this.rowHeight) - centerEl.clientHeight);
        calcScrollTop = (scrollTop % ((store.pageSize * this.rowHeight) + 1));
        if (useMax) {
            calcScrollTop = maxScrollTop;
        }
        if (calcScrollTop > maxScrollTop) {
            //Ext.Error.raise("Calculated scrollTop was larger than maxScrollTop");
            return;
            // calcScrollTop = maxScrollTop;
        }
        for (; i < len; i++) {
            items[i].el.dom.scrollTop = calcScrollTop;
        }
    }
});

/**
@class Sch.feature.AbstractTimeSpan
@extends Ext.util.Observable

Plugin for visualizing "global" time span in the scheduler grid, these can by styled easily using just CSS. This is an abstract class not intended for direct use.

*/
Ext.define("Sch.feature.AbstractTimeSpan", {
    
    schedulerView       : null,
    timeAxis            : null,
    containerEl         : null,
    
    disabled            : false,
    
    /**
     * @property {String} cls Unique css class to be able to identify only the zones belonging to this plugin
     */
    cls                 : null,
    
    /**
     * @cfg {Ext.XTemplate} template Template to render the timespan elements  
     */
    template            : null,

    /**
     * @cfg {Ext.data.Store} store A store with timespan data 
     */
    store               : null,
    
    renderElementsBuffered      : false,
    
    

    constructor : function(cfg) {
        // unique css class to be able to identify only the zones belonging to this plugin
        this.cls = this.cls || ('sch-timespangroup-' + Ext.id());
        
        Ext.apply(this, cfg);
    },

    
    /**
     * @param {Boolean} disabled Pass `true` to disable the plugin (and remove all lines)
     */
    setDisabled : function(disabled) {
        if (disabled) {
            this.removeElements();
        }
        
        this.disabled = disabled;
    },

    
    /**
     * Returns the currently rendered DOM elements of this plugin (if any), as the {@link Ext.CompositeElementLite} instance.  
     * @return {Ext.CompositeElementLite}
     */
    getElements : function() {
        return this.containerEl.select('.' + this.cls);
    },
    
    
    // private
    removeElements : function() {
        return this.getElements().remove();
    },
    
    
    init:function(scheduler) {
        this.timeAxis = scheduler.getTimeAxis();
        this.schedulerView = scheduler.getSchedulingView(); 
    
        if (!this.store) {
            throw "Without a store, there's not much use for this plugin";
        }
        
        this.schedulerView.on({
            afterrender : this.onAfterRender, 
            destroy : this.onDestroy, 
            scope : this
        });
    },
    
    
    onAfterRender : function (scheduler) {
        var view            = this.schedulerView;
        this.containerEl    = view.el;
        
        this.store.on({
            load            : this.renderElements,
            datachanged     : this.renderElements, 
            clear           : this.renderElements,
            
            add             : this.renderElements, 
            update          : this.renderElements, 
            remove          : this.renderElements, 
            
            scope           : this
        });
        
        if (view.store instanceof Ext.data.NodeStore) {
            // if the view is animated, then update the elements in "after*" events (when the animation has completed)
            if (view.animate) {
                view.on({
                    afterexpand     : this.renderElements, 
                    aftercollapse   : this.renderElements,
                    
                    scope           : this
                });
            } else {
                view.store.on({
                    expand      : this.renderElements, 
                    collapse    : this.renderElements,
                    
                    scope       : this
                });
            }
        }
        
        view.on({
            itemadd         : this.renderElements,
            itemupdate      : this.renderElements,
            // start grouping events
            groupexpand     : this.renderElements, 
            groupcollapse   : this.renderElements,
            
            scope           : this
        });

        view.on({
            refresh         : this.renderElements, 
            scope           : this
        });

        this.renderElements();
    },
    
    renderElements : function() {
        if (this.renderElementsBuffered || this.disabled || this.schedulerView.headerCt.getColumnCount() === 0) return;
        
        this.renderElementsBuffered = true;
        
        // Defer to make sure rendering is not delayed by this plugin
        // deferring on 15 because the cascade delay is 10 (cascading will trigger a view refresh)
        Ext.Function.defer(this.renderElementsInternal, 15, this);
    },
    
    renderElementsInternal : function() {
        this.renderElementsBuffered = false;
        
        //                            | component can be destroyed during the buffering timeframe
        if (this.disabled || this.schedulerView.isDestroyed || this.schedulerView.headerCt.getColumnCount() === 0) return;
        
        this.removeElements();
        
        var start = this.timeAxis.getStart(), 
            end = this.timeAxis.getEnd(),
            data = this.getElementData(start, end);
        
        for (var i = 0, l = data.length; i < l; i++) {
            // Add an identifier to be able to 
            data[i].uniquecls = this.cls;
        }
        this.template.insertFirst(this.containerEl, data);
    },
    
    
    getElementData : function(viewStart, viewEnd, containerHeight) {
        throw 'Abstract method call';
    },

    
    onDestroy : function() {
        if (this.store.autoDestroy) {
            this.store.destroy();
        }
    }
}); 

/*
* @private
* @class Sch.feature.DragCreator
* @extends Ext.util.Observable
* @constructor
* An internal class which shows a drag proxy while clicking and dragging.
* Create a new instance of this plugin
* @param {Sch.schedulerViewPanel} scheduler The scheduler instance
* @param {Object} config The configuration options
*/
Ext.define("Sch.feature.DragCreator", {
    requires : [
        'Ext.XTemplate',
        'Sch.util.Date',
        'Sch.util.DragTracker',
        'Sch.tooltip.Tooltip',
        'Sch.tooltip.ClockTemplate'
    ],

    extend : "Ext.util.Observable",

    /**
    * @cfg {Boolean} disabled true to start disabled 
     */
    disabled: false,

    /**
    * @cfg {Boolean} showHoverTip true to show a time tooltip when hovering over the time cells
    */
    showHoverTip: true,

    /**
    * @cfg {Boolean} showDragTip true to show a time tooltip when dragging to create a new event
    */
    showDragTip: true,

    /**
    * @cfg {Int} dragTolerance Number of pixels the drag target must be moved before dragging is considered to have started. Defaults to 2.
    */
    dragTolerance: 2,

    /**
    * @cfg {Ext.Template} template The HTML template shown when dragging to create new items
    */
    
    /**
    * An empty function by default, but provided so that you can perform custom validation on the item being created
    * @param {Ext.data.Model} resourceRecord the resource for which the event is being created
    * @param {Date} startDate
    * @param {Date} endDate
    * @param {Event} e The event object
    * @return {Boolean} isValid True if the creation event is valid, else false to cancel
    */
    validatorFn: Ext.emptyFn,

    /**
    * @cfg {Object} validatorFnScope
    * The scope for the validatorFn
    */
    validatorFnScope: null,

    
    constructor : function (config) {
        Ext.apply(this, config || {});
   
        this.lastTime = new Date();
        this.template = this.template || Ext.create("Ext.Template", 
            '<div class="sch-dragcreator-proxy sch-event">' +
                '<div class="sch-event-inner">&#160;</div>' + 
            '</div>',
            {
                compiled : true,
                disableFormats : true
            } 
        );

        this.schedulerView.on({
            render: this.onSchedulerRender,
            destroy: this.onSchedulerDestroy,
            scope: this
        });

        this.callParent([config]); 
    },
    
    
    /**
    * Enable/disable the plugin
    * @param {Boolean} disabled True to disable this plugin
    */
    setDisabled: function (disabled) {
        this.disabled = disabled;
        if (this.hoverTip) {
            this.hoverTip.setDisabled(disabled);
        }
            
        if (this.dragTip) {
            this.dragTip.setDisabled(disabled);
        }
    },

    getProxy : function() {
        if (!this.proxy) {
            this.proxy = this.template.append(this.schedulerView.panel.el, {}, true);
        }
        return this.proxy;
    },

    // private
    onMouseMove: function (e) {
        var tip = this.hoverTip;
        
        // If tip is disabled, return
        if (tip.disabled || this.dragging) {
            return;
        }
        
        if (e.getTarget('.' + this.schedulerView.timeCellCls, 2)) {
            
            var time = this.schedulerView.getDateFromDomEvent(e, 'floor');
            
            if (time) {
                if (time - this.lastTime !== 0) {
                    this.updateHoverTip(time);
                    this.lastTime = time;
                    
                    if (tip.hidden) { // HACK, find better solution
                        tip[Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0 ? 'addCls' : 'removeCls']('sch-day-resolution');
                        tip.show(); 
                    }
                }
            } else {
                tip.hide();
                this.lastTime = null;
            }
        } else {
            tip.hide();
            this.lastTime = null;
        }
    },

    // private
    updateHoverTip: function (date) {
        if (date) {
            var formattedDate = this.schedulerView.getFormattedDate(date);

            this.hoverTipTemplate.overwrite(this.hoverTip.body, {
                date: date,
                text: formattedDate
            });
            this.hoverTip.doComponentLayout();
        }
    },

    // private
    onBeforeDragStart: function (e) {
        var s = this.schedulerView,
            t = e.getTarget('.' + s.timeCellCls, 2);

        if (t) {
            var resourceRecord = s.resolveResource(t);
            var dateTime = s.getDateFromDomEvent(e);

            if (!this.disabled && t && s.fireEvent('beforedragcreate', s, resourceRecord, dateTime, e) !== false) {

                // Save record if the user ends the drag outside the current row
                this.resourceRecord = resourceRecord;
           
                // Start time of the event to be created
                this.originalStart = dateTime;

                // Constrain the dragging within the current row schedule area
                this.resourceRegion = s.getScheduleRegion(this.resourceRecord, this.originalStart);
                
                // Save date constraints
                this.dateConstraints = s.getDateConstraints(this.resourceRecord, this.originalStart);
                
                // TODO apply xStep or yStep to drag tracker
                return true;
            }
        }
        return false;
    },

    // private
    onDragStart: function () {
        var me = this,
            view = me.schedulerView,
            proxy = me.getProxy(),
            snap = me.schedulerView.snapToIncrement;

        this.dragging = true;

        if (this.hoverTip) {
            this.hoverTip.disable();
        }

        me.start = me.originalStart;
        me.end = me.start;

        if (view.getOrientation() === 'horizontal') {
            me.rowBoundaries = {
                top : me.resourceRegion.top,
                bottom : me.resourceRegion.bottom
            };
        
            proxy.setRegion({
                top : me.rowBoundaries.top, 
                right : me.tracker.startXY[0], 
                bottom : me.rowBoundaries.bottom, 
                left : me.tracker.startXY[0]
            });
        } else {
            me.rowBoundaries = {
                left : me.resourceRegion.left,
                right : me.resourceRegion.right
            };
        
            proxy.setRegion({
                top : me.tracker.startXY[1], 
                right : me.resourceRegion.right, 
                bottom : me.tracker.startXY[1],
                left : me.resourceRegion.left
            });
        }

        proxy.show();

        me.schedulerView.fireEvent('dragcreatestart', me.schedulerView);
        
        if (me.showDragTip) {
            me.dragTip.enable();
            me.dragTip.update(me.start, me.end, true);
            me.dragTip.show(proxy);
            
            // for some reason Ext set `visibility` to `hidden` after couple of `.hide()` calls
            me.dragTip.el.setStyle('visibility', 'visible');
        }
    },

    // private
    onDrag: function (e) {
        var me = this,
            view = me.schedulerView,
            dragRegion = me.tracker.getRegion().constrainTo(me.resourceRegion),
            dates = view.getStartEndDatesFromRegion(dragRegion, 'round');
        
        if (!dates) {
            return;
        }

        me.start = dates.start || me.start;
        me.end = dates.end || me.end;
        
        var dc = me.dateConstraints;

        if (dc) {
            me.end = Sch.util.Date.constrain(me.end, dc.start, dc.end);
            me.start = Sch.util.Date.constrain(me.start, dc.start, dc.end);
        }

        me.valid = this.validatorFn.call(me.validatorFnScope || me, me.resourceRecord, me.start, me.end) !== false;

        if (me.showDragTip) {
            me.dragTip.update(me.start, me.end, me.valid);
        }

        Ext.apply(dragRegion, me.rowBoundaries);

        this.getProxy().setRegion(dragRegion);
    },

    // private
    onDragEnd: function (e) {
        this.dragging = false;
        var s = this.schedulerView;

        if (this.showDragTip) {
            this.dragTip.disable();
        }
        
        if (!this.start || !this.end || (this.end - this.start <= 0)) {
            this.valid = false;
        }

        if (this.valid) {
            var ev = Ext.create(this.schedulerView.eventStore.model);
            ev.setResource(this.resourceRecord);
            ev.setStartDate(this.start);
            ev.setEndDate(this.end);
            s.fireEvent('dragcreateend', s, ev, this.resourceRecord, e);
        } else {
            this.proxy.hide();
        }

        this.schedulerView.fireEvent('afterdragcreate', s);
        
        if (this.hoverTip) {
            this.hoverTip.enable();
        }
    },

    tipCfg: {
        trackMouse: true,
        bodyCssClass: 'sch-hovertip',
        autoHide: false,
        dismissDelay: 1000,
        showDelay: 300
    },

    dragging : false,

    // private 
    onSchedulerRender: function () {
        var sv = this.schedulerView,
            gridViewBodyEl = sv.el,
            bind = Ext.Function.bind;
        
        this.tracker = new Sch.util.DragTracker({
            el : gridViewBodyEl,
            tolerance: this.dragTolerance,
            onBeforeStart: bind(this.onBeforeDragStart, this),
            onStart: bind(this.onDragStart, this),
            onDrag: bind(this.onDrag, this),
            onEnd: bind(this.onDragEnd, this)
        });

        if (this.showDragTip) {
            this.dragTip = Ext.create("Sch.tooltip.Tooltip", {
                cls : 'sch-dragcreate-tip',
                schedulerView : sv,
                listeners : {
                    beforeshow : {
                        fn : function() { return this.dragging; },
                        scope : this
                    }
                }
            });
        }

        if (this.showHoverTip) {
            this.hoverTipTemplate = this.hoverTipTemplate || Ext.create("Sch.tooltip.ClockTemplate");

            this.hoverTip = new Ext.ToolTip(Ext.applyIf({
                renderTo: document.body,  
                target : gridViewBodyEl,
                disabled: this.disabled
            }, this.tipCfg));

            this.hoverTip.on('beforeshow', this.tipOnBeforeShow, this);

            sv.mon(gridViewBodyEl, {
                mouseleave : function () {
                    this.hoverTip.hide();
                },
                mousemove : this.onMouseMove, 
                scope : this
            });
        }
    },

    onSchedulerDestroy: function () {
        if (this.hoverTip) {
            this.hoverTip.destroy();
        }

        if (this.dragTip) {
            this.dragTip.destroy();
        }

        if (this.tracker) {
            this.tracker.destroy();
        }

        if (this.proxy) {
            Ext.destroy(this.proxy);
            this.proxy = null;
        }
    },

    tipOnBeforeShow: function (tip) {
        return !this.disabled && !this.dragging && tip.body.dom.innerHTML !== "" && this.lastTime !== null;
    }
});

Ext.define("Sch.feature.DragZone", {
    extend : "Ext.dd.DragZone", 
            
    containerScroll : true,
    
    onStartDrag : function () {
        var s = this.schedulerView;
        s.fireEvent('eventdragstart', s, this.dragData.records);
    },
    
    // On receipt of a mousedown event, see if it is within a draggable element.
    // Return a drag data object if so. The data object can contain arbitrary application
    // data, but it should also contain a DOM element in the ddel property to provide
    // a proxy to drag.
    getDragData: function(e) {
        var s = this.schedulerView,
            sourceNode = e.getTarget(s.eventSelector);
        
        if (sourceNode) {
            var sm = s.getSelectionModel(),
                sourceNodeEl = Ext.get(sourceNode),
                eventEl = sourceNodeEl.is(s.eventSelector) ? sourceNode : sourceNodeEl.up(s.eventSelector).dom,
                sourceEventRecord = s.getEventRecordFromDomId(eventEl.id);
                    
            if (s.fireEvent('beforeeventdrag', s, sourceEventRecord, e) === false) {
                return null;
            }

            var nodes,
                start = sourceEventRecord.getStartDate(),
                selectedRecords = [sourceEventRecord],   // Not supporting dragging of multiple records
                copy,
                wrap = Ext.get(Ext.core.DomHelper.createDom({
                    cls : 'sch-dd-wrap',
                    children : [{
                        cls : 'sch-dd-proxy-hd',
                        html : '&nbsp'
                    }]
                }));
                
            for(var i = 0, len = selectedRecords.length; i < len; i++){
                copy = s.getElementFromEventRecord(selectedRecords[i]).dom.cloneNode(true);
                copy.id = Ext.id();
                wrap.appendChild(copy);
            }
            return {
                repairXY: Ext.fly(sourceNode).getXY(),
                ddel: wrap.dom,
                sourceEventRecord : sourceEventRecord,
                records : selectedRecords,
                duration : sourceEventRecord.getEndDate() - start
            };
        }
        return null;
    },
    
    // Override, get rid of weird highlight fx in default implementation
    afterRepair : function(){
        this.dragging = false;
        var s = this.schedulerView;
        s.fireEvent('aftereventdrop', s);
    },

    // Provide coordinates for the proxy to slide back to on failed drag.
    // This is the original XY coordinates of the draggable element.
    getRepairXY: function() {
        return this.dragData.repairXY;
    },
    
    onDragKeyDown : function(e) {
        var p = this.getProxy();
        if (e.ctrlKey && (p.dropStatus === p.dropAllowed || p.dropStatus === (p.dropAllowed + " add"))) {
            p.setStatus(p.dropAllowed + " add");
        }
    },
    
    onDragKeyUp : function(e) {
        if (!e.ctrlKey) {
            var p = this.getProxy();
            p.setStatus(p.dropStatus.replace(' add', ''));
        }
    },
   
    // Register key listener for copy functionality
    onMouseDown: function() {   
        if (this.enableCopy) {
            Ext.getBody().on({
                'keydown' : this.onDragKeyDown,
                'keyup'   : this.onDragKeyUp,
                scope : this
            });
        }
    },
    
    // Deregister key listener for copy functionality
    onMouseUp : function() {
        var b = Ext.getBody();
        b.un('keydown', this.onDragKeyDown, this);
        b.un('keyup', this.onDragKeyUp, this);
    }
});

Ext.define("Sch.feature.DropZone", {
    extend : "Ext.dd.DropZone", 

    constructor : function() {
        this.callParent(arguments);
        var schedulerView = this.schedulerView;

        this.proxyTpl = this.proxyTpl || new Ext.XTemplate(
            '<span class="sch-dd-newtime">' +
                '{[ this.getText(values) ]}' + 
            '</span>',
            {
                getText : function(vals) {
                    var retVal = schedulerView.getFormattedDate(vals.StartDate);
                        
                    if (vals.Duration) {
                        retVal += ' - ' + schedulerView.getFormattedEndDate(Sch.util.Date.add(vals.StartDate, Sch.util.Date.MILLI, vals.Duration), vals.StartDate);
                    } 
                    return retVal;
                }
            }
        );
    },

    validatorFn : Ext.emptyFn,

    getTargetFromEvent: function(e) {
        return e.getTarget('.' + this.schedulerView.timeCellCls);
    },
    
    // On entry into a target node, highlight that node.
    onNodeEnter : function(target, dragSource, e, data){ 
        Ext.fly(target).addCls('sch-dd-cellover');
    },

    // On exit from a target node, unhighlight that node.
    onNodeOut : function(target, dragSource, e, data){ 
        Ext.fly(target).removeCls('sch-dd-cellover');
    },
    
    onNodeOver : function(target, dragSource, e, data){
        var s = this.schedulerView,
            date = s.getDateFromDomEvent(e, 'round'),
            newText;
        
        if (!date) return this.dropNotAllowed;
        
        this.proxyTpl.overwrite(dragSource.proxy.el.down('.sch-dd-proxy-hd'), {
            StartDate : date,
            Duration : data.duration
        });
        
        var targetRecord = s.resolveResource(e.getTarget('.' + s.timeCellCls));
            
        if (this.validatorFn.call(this.validatorFnScope || this, data.records, targetRecord, date, data.duration, e) !== false) {
            return this.dropAllowed + ((this.enableCopy && e.ctrlKey) ? ' add' : '');
        } else {
            return this.dropNotAllowed;
        }
    },
    
    onNodeDrop : function(target, dragSource, e, data){
        var s = this.schedulerView,
            targetRecord = s.resolveResource(target),
            date = s.getDateFromDomEvent(e, 'round'),
            valid = false,
            isCopy = this.enableCopy && e.ctrlKey;
            
        if (date && this.validatorFn.call(this.validatorFnScope || this, data.records, targetRecord, date, data.duration, e) !== false) {
            var copies,
                index = s.resourceStore.indexOf(targetRecord);

            if (isCopy) {
                copies = this.copyRecords(data.records, date, targetRecord, data.sourceEventRecord, index);
                valid = true;
            } else {
                valid = this.updateRecords(data.records, date, targetRecord, data.sourceEventRecord, index, data);
            }
            
            // Clear selections after succesful drag drop
            if (valid) {
                s.getSelectionModel().deselectAll();
            }
            s.fireEvent('eventdrop', s, isCopy ? copies : data.records, isCopy);
        }
        
        s.fireEvent('aftereventdrop', s);
        return valid;
    },
    
    /** 
     *  Update the event record with the new information
     */
    updateRecords : function(records, newStartDate, dropResourceRecord, sourceEventRecord, targetIndex, data) {
        // Simplified scenario, 1 drag drop item
        if (records.length === 1) {
            sourceEventRecord.beginEdit();
            sourceEventRecord.setResource(dropResourceRecord);
            sourceEventRecord.setStartDate(newStartDate);
            sourceEventRecord.setEndDate(Sch.util.Date.add(newStartDate, Sch.util.Date.MILLI, data.duration));
            sourceEventRecord.endEdit();
            return true;
        }
        
        var sourceEventRecordStart = sourceEventRecord.getStartDate(),
            resourceStore = dropResourceRecord.store,
            diffStart = newStartDate - sourceEventRecordStart,
            sourceIndex = resourceStore.indexOf(sourceEventRecord.getResource()),
            diff,
            oldIndex,
            newResourceRecord,
            r,
            newIndex,
            nbrRecords = resourceStore.getCount(),
            i;
        
        // Validate, make sure all items fit within the current view
        for (i = 0; i < records.length; i++) {
            r = records[i];
            oldIndex = resourceStore.indexOf(r.getResource());
            newIndex = oldIndex - sourceIndex + targetIndex;
            if (newIndex < 0 || newIndex > nbrRecords) {
                return false;
            }
        }
                        
        for (i = 0; i < records.length; i++) {
            r = records[i];
            oldIndex = resourceStore.indexOf(r.getResource());
            diff = oldIndex - sourceIndex;
            newResourceRecord = resourceStore.getAt(targetIndex + diff);
            r.beginEdit();
            r.setResource(newResourceRecord);
            r.setStartDate(Sch.util.Date.add(r.getStartDate(), Sch.util.Date.MILLI, diffStart));
            r.setEndDate(Sch.util.Date.add(r.getEndDate(), Sch.util.Date.MILLI, diffStart));
            r.endEdit();
        }
        
        return true;
    },
    
    // Update the event record with the new information
    copyRecords : function(records, newStartDate, targetRecord, sourceEventRecord, targetIndex) {
        var record = records[0],
            newItem = record.copy(),
            duration = sourceEventRecord.getEndDate() - sourceEventRecord.getStartDate();
        
        newItem.setResource(targetRecord);
        newItem.setStartDate(newStartDate);
        newItem.setEndDate(Sch.util.Date.add(newStartDate, Sch.util.Date.MILLI, duration));
        
        return [newItem];
    }
});


/*
 * @class Sch.PointSchedulerDragZone
 * @private
 * @extends Ext.dd.DragZone
 * Custom dragzone that also acts as the dropzone, and constrains the drag to the table row that contains the dragged element
 * @constructor
 * @param {Object} config The object containing the configuration of this model.
 */
Ext.define("Sch.feature.PointDragZone", {
    extend      : "Ext.dd.DragZone",
    
    requires    : [
        'Sch.tooltip.Tooltip'
    ],
    
    
    repairHighlight : false,
    containerScroll : true,
    dropAllowed : "sch-dragproxy",
    dropNotAllowed : "sch-dragproxy",

    constructor : function(el, config){
        this.proxy = Ext.create("Ext.dd.StatusProxy", {
            shadow : false,
            dropAllowed : "sch-dragproxy",
            dropNotAllowed : "sch-dragproxy"
        });
        this.callParent(arguments);
        this.isTarget = true;
        this.scroll = false;
        this.ignoreSelf = false;
        Ext.dd.ScrollManager.register(this.el);
    },

    destroy : function(){
        this.callParent(arguments);
        Ext.dd.ScrollManager.unregister(this.el);
    },
    
    autoOffset: function(x, y) {
        var xy = this.dragData.repairXY, // Original position of the element
            xDelta = x - xy[0],
            yDelta = y - xy[1];

        this.setDelta(xDelta, yDelta);
    },
    
    constrainTo : function(constrainingRegion, elRegion){
        this.resetConstraints();
        this.initPageX = constrainingRegion.left;
        this.initPageY = constrainingRegion.top;
        this.setXConstraint(constrainingRegion.left, constrainingRegion.right - (elRegion.right - elRegion.left), this.xTickSize);
        this.setYConstraint(constrainingRegion.top, constrainingRegion.bottom - (elRegion.bottom - elRegion.top), this.yTickSize);
    },

    setXConstraint: function(iLeft, iRight, iTickSize) {
        this.leftConstraint = iLeft;
        this.rightConstraint = iRight;
    
        this.minX = iLeft;
        this.maxX = iRight;
        if (iTickSize) { this.setXTicks(this.initPageX, iTickSize); }
        
        this.constrainX = true;
    },

    setYConstraint: function(iUp, iDown, iTickSize) {
        this.topConstraint = iUp;
        this.bottomConstraint = iDown;
        
        this.minY = iUp;
        this.maxY = iDown;
        if (iTickSize) { this.setYTicks(this.initPageY, iTickSize); }

        this.constrainY = true;
    },

    resolveStartEndDates : function(proxyRegion) {
        var dd = this.dragData,
            startEnd,
            start = dd.origStart,
            end = dd.origEnd;
        
        if (!dd.startsOutsideView) {
            startEnd = this.schedulerView.getStartEndDatesFromRegion(proxyRegion, 'round');
            if (startEnd) {
                start = startEnd.start || dd.start;
                end = Sch.util.Date.add(start, Sch.util.Date.MILLI, dd.duration);
            }
        } else if (!dd.endsOutsideView) {
            startEnd = this.schedulerView.getStartEndDatesFromRegion(proxyRegion, 'round');
            if (startEnd) {
                end = startEnd.end || dd.end;
                start = Sch.util.Date.add(end, Sch.util.Date.MILLI, -dd.duration);
            }
        }
        
        return {
            startDate : start,
            endDate : end
        };
    },

    onDragOver: function(e, id){
        if (this.showTooltip) {
            var dd = this.dragData,
                context = this.getDragContext(e);

            if (!dd.originalHidden) {
                dd.sourceNode.hide();
                dd.originalHidden = true;
            }
        
            this.tip.update(context.startDate, context.endDate, context.valid);
        }
    },

    getDragContext : function(e) {
        var dd = this.dragData,
            s = this.schedulerView,
            proxyRegion = this.proxy.el.getRegion();
            
        var context = this.resolveStartEndDates(proxyRegion);
        context.resource = s.constrainDragToResource ? dd.resourceRecord : this.resolveResource([proxyRegion.left + dd.offsets[0], proxyRegion.top + dd.offsets[1]], e);
        
        if (context.resource) {
            context.valid = this.validatorFn.call(this.validatorFnScope || this, [dd.eventRecord], context.resource, context.startDate, dd.duration, e); 
        } else {
            context.valid = false;
        }
        return context;
    },
            
    onStartDrag : function (x, y) {
        var s = this.schedulerView,
            dd = this.dragData;
        
        this.start = dd.origStart;
        this.end =  dd.origEnd;
       
        s.fireEvent('eventdragstart', s, [dd.eventRecord]);
    },

    // HACK, overriding private method, proxy needs to be shown before aligning to it
    startDrag : function() {
        var retVal = this.callParent(arguments);
        
        if (this.showTooltip) {
            var s = this.schedulerView;

            if (!this.tip) {
                this.tip = Ext.create("Sch.tooltip.Tooltip", {
                    schedulerView : s,
                    cls : 'sch-dragdrop-tip'
                });
            }
            this.tip.update(this.start, this.end, true);
            this.tip.show(this.proxy.el, this.dragData.offsets[0]);
        }

        return retVal;
    },
            
    getDragData: function(e) {
        var s = this.schedulerView,
            t = e.getTarget(s.eventSelector);
        
        if (!t) {   
            return;
        }

        var eventRecord = s.resolveEventRecord(t);

        if (s.fireEvent('beforeeventdrag', s, eventRecord, e) === false) {
            return null;
        }
       
        var xy = e.getXY(),
            eventEl = Ext.get(t),
            eventXY = eventEl.getXY(),
            offsets = [xy[0] - eventXY[0], xy[1] - eventXY[1]],
            resource = eventRecord.getResource(),
            eventRegion = eventEl.getRegion(),
            tickSize = s.getSnapPixelAmount();
        
        this.clearTicks();

        if (s.constrainDragToResource) {
            this.constrainTo(s.getScheduleRegion(resource, eventRecord), eventRegion);
        } else {
            this.constrainTo(s.getScheduleRegion(null, eventRecord), eventRegion);
        }
        
        if (tickSize >= 1) {
            if (s.getOrientation() === 'horizontal') {
                this.setXConstraint(this.leftConstraint, this.rightConstraint, tickSize);
            } else {
                this.setYConstraint(this.topConstraint, this.bottomConstraint, tickSize);
            }
        }

        var origStart = eventRecord.getStartDate(),
            ta = s.timeAxis,
            viewStart = ta.getStart(),
            viewEnd = ta.getEnd(),
            origEnd = eventRecord.getEndDate(),
            copy = eventEl.dom.cloneNode(true),
            startsOutsideView = origStart < viewStart,
            endsOutsideView = origEnd > viewEnd,
            bodyScroll = Ext.getBody().getScroll();
        copy.id = Ext.id();

        return {
            offsets : offsets,
            sourceNode : eventEl,
            repairXY: eventXY,
            ddel: copy,
            eventRecord : eventRecord,
            resourceRecord : resource,
            origStart : origStart,
            origEnd : origEnd,
            eventNodeWidth : eventRegion.right - eventRegion.left,
            duration : origEnd - origStart,
            startsOutsideView : startsOutsideView,
            endsOutsideView : endsOutsideView,
            bodyScroll : bodyScroll
        };
    },
           
    onDragDrop: function(e, id){
        var s = this.schedulerView,
            target = this.cachedTarget || Ext.dd.DragDropMgr.getDDById(id),
            dragData = this.dragData,
            context = this.getDragContext(e),
            rec = dragData.eventRecord,
            start = context.startDate,
            modified = false;
 
        if (context.valid && context.startDate && context.endDate) {
            var newResource = context.resource;
                modified = (context.startDate - dragData.origStart) !== 0 ||
                           newResource !== rec.getResource();

            rec.beginEdit();
            rec.setResource(newResource);
            rec.setStartDate(context.startDate);
            rec.setEndDate(context.endDate);
            rec.endEdit();

            s.fireEvent('eventdrop', s, [rec], false);
        }
        if (this.tip) {
            this.tip.hide();
        }

        if (!rec.dirty) {
            s.onEventUpdate(rec.store, rec);
        }

        if(context.valid && modified){ 
            this.onValidDrop(target, e, id);
            s.fireEvent('aftereventdrop', s);
        }else{
            this.onInvalidDrop(target, e, id);
        }
    },

    onInvalidDrop : function() {
        var s = this.schedulerView;

        if (this.tip) {
            this.tip.hide();
        }
        this.dragData.sourceNode.show();
        this.callParent();
        s.fireEvent('aftereventdrop', s);
    },

    resolveResource : function(xy, e) {
        var eventDom = this.proxy.el.dom;
        
        eventDom.style.display = 'none';
        var node    = document.elementFromPoint(xy[0] - this.dragData.bodyScroll.left, xy[1] - this.dragData.bodyScroll.top);
        
        // IE8 like it twice, for simulated events..
        if (Ext.isIE8 && e && e.browserEvent.synthetic) {
            node    = document.elementFromPoint(xy[0] - this.dragData.bodyScroll.left, xy[1] - this.dragData.bodyScroll.top);
        }
        
        eventDom.style.display = 'block';
        
        if (!node) {
            return null;
        }
        
        if (!node.className.match(this.schedulerView.timeCellCls)) {
            var parent = Ext.fly(node).up('.' + this.schedulerView.timeCellCls);
            if (parent) {
                node = parent.dom;
                return this.schedulerView.resolveResource(node);
            }
            return null;
        }
        return this.schedulerView.resolveResource(node);
    }
});


/*
 * @class Sch.feature.DragDrop
 * @extends Ext.util.Observable
 * @private
 * Internal class enabling drag and drop for event nodes
 * @constructor
 * @param {Sch.panel.SchedulerGrid} scheduler The scheduler instance
 * @param {Object} config The object containing the configuration of this model.
 */
Ext.define("Sch.feature.DragDrop", {
    extend : "Ext.util.Observable",
    
    requires : [
        'Ext.XTemplate',
        'Sch.feature.PointDragZone',
        'Sch.feature.DragZone',
        'Sch.feature.DropZone'
    ],

    /**
     * An empty function by default, but provided so that you can perform custom validation on 
     * the item being dragged. This function is called during the drag and drop process and also after the drop is made
     * @param {Array} dragRecords an array containing the records for the events being dragged
     * @param {Ext.data.Model} targetResourceRecord the target resource of the the event 
     * @param {Date} date The date corresponding to the current mouse position
     * @param {Int} duration The duration of the item being dragged
     * @param {Event} e The event object
     * @return {Boolean} true if the drop position is valid, else false to prevent a drop
     */
    validatorFn : function(dragRecords, targetResourceRecord, date, duration, e) {
        return true;
    },
    
    /**
     * @cfg {Object} validatorFnScope
     * The scope for the validatorFn
     */
    
    /**
     * @cfg {Boolean} enableCopy (Experimental) true to enable copy by pressing CTRL key during drag drop,
     *                only supported for a single record.
     */
    enableCopy : false,

    /**
     * @cfg {Boolean} useDragProxy true to force classic drag-drop mode using a proxy.
     */
    useDragProxy : false,

    /**
     * @cfg {Boolean} showTooltip true to show a tooltip when dragging without proxy
     */
    showTooltip : true,

    constructor : function(schedulerView, config) {
        Ext.apply(this, config);
        
        this.schedulerView = schedulerView;

        this.schedulerView.on({
            afterrender : this.onRender, 
            destroy : this.cleanUp,
            scope : this
        });

        this.callParent([config]);
    },

    cleanUp : function() {
        if (this.schedulerView.dragZone) {
            this.schedulerView.dragZone.destroy();
        }

        if (this.schedulerView.dropZone) {
            this.schedulerView.dropZone.destroy();
        }

        if (this.tip) {
            this.tip.destroy();
        }
    },
        
    // private
    onRender : function() {
        var supportsElementFromPoint = !!document.elementFromPoint;
        
        if (!this.useDragProxy && !this.dragConfig.useDragProxy && supportsElementFromPoint) {
            this.initProxyLessDD();
        } else {
            this.initProxyDD();
        }
    },

    initProxyLessDD : function() {
        var s = this.schedulerView;
            
        // The drag zone behaviour
        s.dragZone = Ext.create("Sch.feature.PointDragZone", s.el, Ext.apply({
            ddGroup : s.id,
            schedulerView : s,
            enableCopy : this.enableCopy,
            validatorFn : this.validatorFn,
            validatorFnScope : this.validatorFnScope,
            showTooltip : this.showTooltip
        }, this.dragConfig));
    },

    initProxyDD: function() {
        var s = this.schedulerView,
            el = s.el;

        // The drag zone behaviour
        s.dragZone = Ext.create("Sch.feature.DragZone", el, Ext.apply({
            ddGroup : s.id,
            schedulerView : s,
            enableCopy : this.enableCopy
        }, this.dragConfig));
        
        // The drop zone behaviour
        s.dropZone = Ext.create("Sch.feature.DropZone", el, Ext.apply({
            ddGroup : s.id,
            schedulerView : s,
            enableCopy : this.enableCopy,
            validatorFn : this.validatorFn,
            validatorFnScope : this.validatorFnScope
        }, this.dropConfig));
    }
});


/*
 * @class Sch.feature.ResizeZone
 * @extends Ext.util.Observable
 * @private
 * Internal classing enabling resizing of rendered events
 * @constructor
 * @param {Sch.panel.SchedulerGrid} scheduler The scheduler instance
 * @param {Object} config The object containing the configuration of this model.
 */

 
Ext.define("Sch.feature.ResizeZone", {
    extend : "Ext.util.Observable",
    requires : [
        'Ext.resizer.Resizer',
        'Sch.tooltip.Tooltip'
    ],

    /**
      * @cfg showTooltip {Boolean} false to not show a tooltip while resizing
      */
    showTooltip : true,
        
    /**
     * An empty function by default, but provided so that you can perform custom validation on 
     * the item being resized.
     * @param {Ext.data.Model} resourceRecord the resource to which the event belongs
     * @param {Ext.data.Model} eventRecord the event being resized
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Ext.EventObject} e The event object
     * @return {Boolean} true if the new duration is valid, else false to signal that it is not.
     */
    validatorFn : Ext.emptyFn,
    
    /**
     * @cfg {Object} validatorFnScope
     * The scope for the validatorFn
     */
    validatorFnScope : null,
    
    constructor : function(config) {
        Ext.apply(this, config);
        
        this.schedulerView.on({
            render : this.onSchedulerRender, 
            destroy : this.cleanUp,
            scope : this
        });

        this.callParent(arguments);
    },

    // private
    onSchedulerRender : function() {
        var s = this.schedulerView;

        s.mon(s.el, {
            mousedown : this.onMouseDown, 
            scope : this, 
            delegate : '.sch-resizable-handle' 
        });
    },
    
    onMouseDown : function(e, t) {
        var s = this.schedulerView,
            eventRec = s.resolveEventRecord(t);

        if (s.fireEvent('beforeeventresize', s, eventRec, e) === false) {
            return;
        }
        e.stopEvent();
        
        var handlePos = this.getHandlePosition(t),
            el = Ext.get(e.getTarget(s.eventSelector));
        this.resizer = this.createResizer(el, eventRec, handlePos, e, t);
        
        
        // Initiate the resize operation programmatically
        if (Ext.versions.extjs.isLessThan("4.1.0")) {
            this.resizer.resizeTracker.onMouseDown(e, this.resizer[handlePos].el.dom);
        } else {
            this.resizer.resizeTracker.onMouseDown(e, this.resizer[handlePos].dom);
        }

        if (this.showTooltip) {
             if (!this.tip) {
                this.tip = Ext.create("Sch.tooltip.Tooltip", {
                    schedulerView : s,
                    cls : 'sch-resize-tip'
                });
            }
            this.tip.update(eventRec.getStartDate(), eventRec.getEndDate(), true);
            this.tip.show(el);
        }
        s.fireEvent('eventresizestart', s, eventRec);
    },

    getHandlePosition : function(node) {
        if (this.schedulerView.getOrientation() === 'horizontal') {
             return node.className.match('start') ? 'west' : 'east';
        } else {
             return node.className.match('start') ? 'north' : 'south';
        }
    },

    // private
    createResizer : function (el, eventRecord, handlePos) {
        var s = this.schedulerView,
            resourceRecord = eventRecord.getResource(),
            increment = s.getSnapPixelAmount(),
            constrainRegion = s.getScheduleRegion(resourceRecord, eventRecord),
            dateConstraints = s.getDateConstraints(resourceRecord, eventRecord),
            resizerCfg = {
                target: el,
                dateConstraints : dateConstraints,
                resourceRecord : resourceRecord,
                eventRecord : eventRecord,
                handles: handlePos.substring(0,1),
                constrainTo : constrainRegion,
                listeners : {
                    resizedrag : this.partialResize,
                    resize : this.afterResize,
                    scope : this 
                }
            };
        
        // Apply orientation specific configs
        if (s.getOrientation() === 'vertical') {
            if (increment > 0) {
                Ext.apply(resizerCfg, {
                    minHeight: increment,
                    heightIncrement : increment
                });
            }
        } else {
            if (increment > 0) {
                Ext.apply(resizerCfg, {
                    minWidth: increment,
                    widthIncrement : increment
                });
            }
             Ext.apply(resizerCfg, {
                maxHeight : el.getHeight()
            });
        }

        var resizer = Ext.create('Ext.resizer.Resizer', resizerCfg);

        // Make sure the resizing event is on top of other events
        el.setStyle('z-index', parseInt(el.getStyle('z-index'), 10)+1);
        return resizer;
    },
    
    getStartEndDates : function(xy) {
        var r = this.resizer,
            rEl = r.el,
            s = this.schedulerView,
            isStart = r.handles[0] === 'w' || r.handles[0] === 'n',
            start,
            end;
            
        if (isStart) {
            end = r.eventRecord.getEndDate();
            start = s.getDateFromXY([rEl.getLeft(), rEl.getTop()], 'round');
        } else {
            start = r.eventRecord.getStartDate();
            end = s.getDateFromXY([rEl.getRight(), rEl.getBottom()], 'round');
        }

        if (r.dateConstraints) {
            start = Sch.util.Date.constrain(start, r.dateConstraints.start, r.dateConstraints.end);
            end = Sch.util.Date.constrain(end, r.dateConstraints.start, r.dateConstraints.end);
        }

        return {
            start : start,
            end : end
        };
    },

    // private
    partialResize : function (r, width, height, e) {
        var s = this.schedulerView,
            startEndDates = this.getStartEndDates(e.getXY()),
            start = startEndDates.start,
            end = startEndDates.end;
        
        if (!start || !end || ((r.start - start === 0) && (r.end - end === 0))) {
            return;
        }
        
        var valid = this.validatorFn.call(this.validatorFnScope || this, r.resourceRecord, r.eventRecord, start, end) !== false;
        
        r.end = end;
        r.start = start;
        
        s.fireEvent('eventpartialresize', s, r.eventRecord, start, end, r.el);
        
        if (this.showTooltip) {
            this.tip.update(start, end, valid);
        }
    },
    
    // private
    afterResize : function (r, w, h, e) {
        if (this.showTooltip) {
            this.tip.hide();
        }
        var resourceRecord = r.resourceRecord,
            eventRecord = r.eventRecord,
            oldStart = eventRecord.getStartDate(),
            oldEnd = eventRecord.getEndDate(),
            start = r.start || oldStart,
            end = r.end || oldEnd,
            sv = this.schedulerView;
        
        if (start && end && (end - start > 0) && // Input sanity check
            ((start - oldStart !== 0) || (end - oldEnd !== 0)) && // Make sure start OR end changed
            this.validatorFn.call(this.validatorFnScope || this, resourceRecord, eventRecord, start, end, e) !== false) {
            
            eventRecord.beginEdit();
            eventRecord.setStartDate(start);
            eventRecord.setEndDate(end);
            eventRecord.endEdit();
        } else {
            sv.refresh();
        }

        // Destroy resizer 
        this.resizer.destroy();
        
        sv.fireEvent('eventresizeend', sv, eventRecord);
    },

    cleanUp : function() {
        if (this.tip) {
            this.tip.destroy();
        }

        Ext.destroy(this.resizeHandleCt);
    }
}); 

/*
 * @class Sch.feature.Scheduling
 * @extends Ext.grid.feature.Feature
 * @private
 * Internal class used to modify the row template for the table rows.
 * Removes standard text-align property of 
 * @constructor
 */
Ext.define('Sch.feature.Scheduling', {
    extend: 'Ext.grid.feature.Feature',
    alias: 'feature.scheduling',

    getMetaRowTplFragments: function() {
        return {
            embedRowAttr : function() { return 'style="height:{rowHeight}px"'; }
        };
    }
});
/*
@class Sch.column.Time
@extends Ext.grid.Column
@private

A Column representing a time span in the schedule
*/
Ext.define('Sch.column.Time', {
    extend          : 'Ext.grid.column.Column',
    alias           : 'timecolumn',

    draggable       : false,
    groupable       : false,
    hideable        : false,
    sortable        : false,
    
    fixed           : true,
    
    align           : 'center',
    tdCls           : 'sch-timetd',
    menuDisabled    : true,
    
    initComponent   : function () {
        this.addEvents('timeheaderdblclick');
        this.enableBubble('timeheaderdblclick');
        
        this.callParent();
    },
    
    initRenderData: function() {
        var me = this;
        me.renderData.headerCls = me.renderData.headerCls || me.headerCls;
        return me.callParent(arguments);
    },
    
    // HACK, overriding private method    
    onElDblClick: function (e, t) {
        this.callParent(arguments);
        
        this.fireEvent('timeheaderdblclick', this, this.startDate, this.endDate, e);
    }
}, function() {
    // Inject placeholder for {headerCls} and sch-timeheader
    Sch.column.Time.prototype.renderTpl = Sch.column.Time.prototype.renderTpl.replace('column-header-inner', 'column-header-inner sch-timeheader {headerCls}');
});


/*
@class Sch.column.Resource
@extends Ext.grid.Column
@private

A Column representing a resource, used only in vertical orientation

*/
Ext.define("Sch.column.Resource", {
    extend : "Ext.grid.Column",
    alias : "widget.resourcecolumn",
    cls : 'sch-resourcecolumn-header',

    /**
     * Default resource column properties
     */
    align : 'center',
    menuDisabled : true,
    hideable : false,
    sortable : false,

    // Overridden since default implementation for some reason sets minWidth = width
    initComponent: function() {
        this.callParent(arguments);
        this.minWidth = undefined;
    }
});
/*
 * @class Sch.column.timeAxis.Horizontal
 * @extends Ext.grid.column.Column
 * @private
 * 
 * A visual representation of the time axis. This class can represent up to three different axes, that are defined in the
 * view preset config object.
 */
Ext.define("Sch.column.timeAxis.Horizontal", {
    extend      : "Ext.grid.column.Column",
    alias       : 'widget.timeaxiscolumn',
    
    requires    : [
        'Ext.Date', 
        'Ext.XTemplate',
        'Sch.column.Time',
        'Sch.preset.Manager'
    ],
    
    
    cls         : 'sch-timeaxiscolumn',
    
    timeAxis                : null,
    
    renderTpl : Ext.versions.extjs.isLessThan("4.1.0") ? 
        ('<div id="{id}-titleContainer" class="' + Ext.baseCSSPrefix + 'column-header-inner sch-column-header-inner">' +
            '<span id="{id}-textEl" style="display:none" class="' + Ext.baseCSSPrefix + 'column-header-text"></span>' +
            
            '<tpl if="topHeaderCells">' +
                '{topHeaderCells}' +
            '</tpl>' +
            '<tpl if="middleHeaderCells">' +
                '{middleHeaderCells}' +
            '</tpl>' +
        '</div>')
        : 
        ('<div id="{id}-titleEl" class="' + Ext.baseCSSPrefix + 'column-header-inner">' +
            '<span id="{id}-textEl" style="display:none" class="' + Ext.baseCSSPrefix + 'column-header-text"></span>' +
        '</div>' +
        '{%this.renderContainer(out,values)%}'),
        
    headerRowTpl    : 
        '<table border="0" cellspacing="0" cellpadding="0" style="{tstyle}" class="sch-header-row sch-header-row-{position}">' +
            '<thead>' +
                '<tr>{cells}</tr>' +
            '</thead>' +
        '</table>',

    headerCellTpl   : 
        '<tpl for=".">' +
            '<td class="sch-column-header x-column-header {headerCls}" style="position : static; text-align: {align}; {style}" tabIndex="0" id="{headerId}" ' +
                'headerPosition="{position}" headerIndex="{index}">' +
                    '<div class="x-column-header-inner">{header}</div>' +
            '</td>' +
        '</tpl>',        
        
    columnConfig            : {},
    
    timeCellRenderer        : Ext.emptyFn,
    timeCellRendererScope   : null,
    
    stubForResizer          : null,
    columnWidth             : null,
    

    initComponent : function() {
        if (!(this.headerRowTpl instanceof Ext.Template)) {
            this.headerRowTpl = Ext.create("Ext.XTemplate", this.headerRowTpl, { compiled : true });
        }

        if (!(this.headerCellTpl instanceof Ext.Template)) {
            this.headerCellTpl = Ext.create("Ext.XTemplate", this.headerCellTpl, { compiled : true });
        }
        
        // to turn this column into group (the actual sub-columns will be added in the `onTimeAxisReconfigure`
        // which seems requires initialized "items" 
        this.columns    = [{}];
        
        this.addEvents('timeheaderdblclick', 'timeaxiscolumnreconfigured');
        this.enableBubble('timeheaderdblclick');
        
        this.stubForResizer = new Ext.Component({
            isOnLeftEdge        : function () {
                return false;
            },
            
            isOnRightEdge       : function () {
                return false;
            },
            
            el                  : {
                dom     : {
                    style   : {}
                }
            }
        });
        
        this.callParent(arguments);
        
        this.onTimeAxisReconfigure();
        
        this.mon(this.timeAxis, 'reconfigure', this.onTimeAxisReconfigure, this);
    },
    
    
    getSchedulingView : function () {
        return this.getOwnerHeaderCt().view;
    },
    
    
    onTimeAxisReconfigure : function () {
        var timeAxis                    = this.timeAxis,
            proposedTimeColumnWidth     = timeAxis.preset.timeColumnWidth,
            schedulingView              = this.rendered && this.getSchedulingView(),
            headerConfig    = timeAxis.headerConfig,
            start           = timeAxis.getStart(),
            end             = timeAxis.getEnd(),
            columnDefaults  = { 
                renderer    : this.timeColumnRenderer, 
                scope       : this,
                width       : this.rendered ? schedulingView.calculateTimeColumnWidth(proposedTimeColumnWidth) : proposedTimeColumnWidth 
            };
        
        var columnConfig    = this.columnConfig = this.createColumns(this.timeAxis, headerConfig, columnDefaults);
        
        this.suspendLayout  = true;
        
        //  can't use "removeAll" since 1) it will reset "suspendLayout" flag (no nesting) 2) it will trigger "doLayout"       
        this.items.each(function (column) {
            this.remove(column);
        }, this);
        
        if (this.rendered) {
            var innerCt     = this.el.child('.x-column-header-inner');
            
            innerCt.select('table').remove();
            
            var renderData  = this.initRenderData();
            
            if (columnConfig.top) {
                Ext.core.DomHelper.append(innerCt, renderData.topHeaderCells);
            }
                
            if (columnConfig.middle) {
                Ext.core.DomHelper.append(innerCt, renderData.middleHeaderCells);
            }
            
            if (!columnConfig.top && !columnConfig.middle) {
                this.el.addCls('sch-header-single-row');
            } else {
                this.el.removeCls('sch-header-single-row');
            }
        }
        
        // need to calculate the own total width myself - starting as of 4.0.6
        var width   = 0;
        
        Ext.each(columnConfig.bottom, function (column) { width += column.width; });
        
        this.width  = width;
        
        // this call will reset the "suspendLayout" to false and will trigger a "doLayout" at the end,
        // so generally the following call is not required
        this.add(columnConfig.bottom);

        // Nickolay TODO: remove this extra doLayout call, since "this.add" will trigger "doLayout" already
        
        // required started from 4.0.2 (otherwise column "remembers" its height and doesn't update)
        // still required as of 4.0.2a
        this.height         = undefined;
        
        this.doLayout();
        
        if (this.rendered) {
            if (this.fireEvent('timeaxiscolumnreconfigured', this) !== false) {
                schedulingView.refresh();
            }
        }
    },
    
    
    afterRender : function () {
        var columnConfig        = this.columnConfig;
        
        if (!columnConfig.middle && !columnConfig.top) {
            this.el.addCls('sch-header-single-row');
        }
        
        this.callParent(arguments);
    },
    
    
    // private
    timeColumnRenderer: function (v, m, rec, row, col, ds, events) {
        var ta          = this.timeAxis,
            colTick     = ta.getAt(col),
            colStart    = colTick.start,
            colEnd      = colTick.end,
            retVal      = this.timeCellRenderer.call(this.timeCellRendererScope || this, m, rec, row, col, ds, colStart, colEnd);

        // Thanks Condor for this fix!
        if (Ext.isIE) {
            m.style += ';z-index:' + (this.items.getCount() - col);
        }
        
        return retVal;
    },
    
    
    initRenderData : function () {
        var columnConfig        = this.columnConfig;
        
        var topHeaderCells      = columnConfig.top ? this.headerRowTpl.apply({
            cells           : this.headerCellTpl.apply(columnConfig.top),
            position        : 'top',
            tstyle          : 'border-top : 0'
        }) : '';
            
        var middleHeaderCells   = columnConfig.middle ? this.headerRowTpl.apply({
            cells           : this.headerCellTpl.apply(columnConfig.middle),
            position        : 'middle',
            tstyle          : columnConfig.top ? '' : 'border-top : 0'
        }) : '';
            
        return Ext.apply(this.callParent(arguments), {
            topHeaderCells      : topHeaderCells,
            middleHeaderCells   : middleHeaderCells,
            
            // can be removed after Ext 4.0.5
            id                  : this.id
        });
    },
    
    
    // Default renderer method if no renderer is supplied in the header config
    defaultRenderer : function(start, end, dateFormat) {
        return Ext.Date.format(start, dateFormat);
    },

    
    // Method generating the column config array for the time columns 
    createColumns : function (timeAxis, headerConfig, defaults) {
        if (!timeAxis || !headerConfig) {
            throw 'Invalid parameters passed to createColumns';
        }
        
        var columns         = [],
            lowestHeader    = headerConfig.bottom || headerConfig.middle,
            ticks           = timeAxis.getTicks(),
            colConfig;
            
        for (var i = 0, l = ticks.length; i < l; i++) {
            colConfig = {
                align       : lowestHeader.align || 'center',
                headerCls   : '',
                
                startDate   : ticks[i].start,
                endDate     : ticks[i].end
            };
            
            if (lowestHeader.renderer) {
                colConfig.header = lowestHeader.renderer.call(lowestHeader.scope || this, ticks[i].start, ticks[i].end, colConfig, i);
            } else {
                colConfig.header = this.defaultRenderer(ticks[i].start, ticks[i].end, lowestHeader.dateFormat);
            }

            columns[ columns.length ] = Ext.create("Sch.column.Time", Ext.apply(colConfig, defaults));
        }

        var headerRows = this.createHeaderRows(timeAxis, headerConfig);

        return {
            bottom          : columns,
            middle          : headerRows.middle,
            top             : headerRows.top
        };
    },

    /*
     * Method generating the config array for any additional header rows
     * @private
     * @param {Sch.data.TimeAxis} timeAxis The time axis used by the scheduler
     * @param {Object} headerConfig The current scheduler header config object 
     * @return {Object} the extra header rows
     */
    createHeaderRows : function (timeAxis, headerConfig) {
        var rows = {};

        if (headerConfig.top) {
            var topRow;
            if (headerConfig.top.cellGenerator) {
                topRow = headerConfig.top.cellGenerator.call(this, timeAxis.getStart(), timeAxis.getEnd());
            } else {
                topRow = this.createHeaderRow(timeAxis, headerConfig.top);
            }
            rows.top = this.processHeaderRow(topRow, 'top');
        }
        
        if (headerConfig.bottom) {
            var middleRow;
            if (headerConfig.middle.cellGenerator) {
                middleRow = headerConfig.middle.cellGenerator.call(this, timeAxis.getStart(), timeAxis.getEnd());
            } else {
                middleRow = this.createHeaderRow(timeAxis, headerConfig.middle);
            }
            rows.middle = this.processHeaderRow(middleRow, 'middle');
        }

        return rows;
    },
    
    
    processHeaderRow : function (rowCells, position) {
        var me      = this;
        
        Ext.each(rowCells, function (rowCell, index) {
            
            rowCell.index       = index;
            rowCell.position    = position;
            // this additional config will allow the top level headers act "on behalf" of the whole column
            // see "Ext.grid.plugin.HeaderResizer#onHeaderCtMouseMove"
            rowCell.headerId    = me.stubForResizer.id;
        });
        
        return rowCells;
    },
    

    // private
    createHeaderRow: function(timeAxis, headerConfig) {
        var cells           = [],
            colConfig,
            start           = timeAxis.getStart(),
            end             = timeAxis.getEnd(),
            totalDuration   = end - start,
            cols            = [],
            dt              = start,
            i               = 0,
            cfg,
            align           = headerConfig.align || 'center',
            intervalEnd;
        
        while (dt < end) {
            intervalEnd =  Sch.util.Date.min(timeAxis.getNext(dt, headerConfig.unit, headerConfig.increment || 1), end);
            
            colConfig = {
                align       : align,
                start       : dt,
                end         : intervalEnd,
                headerCls   : ''
            };
                
            if (headerConfig.renderer) {
                colConfig.header = headerConfig.renderer.call(headerConfig.scope || this, dt, intervalEnd, colConfig, i);
            } else {
                colConfig.header = this.defaultRenderer(dt, intervalEnd, headerConfig.dateFormat, colConfig, i);
            }
               
            cells.push(colConfig);
            dt = intervalEnd;
            i++;
        }

        return cells;
    },
    
    
    afterLayout: function () {
        delete this.columnWidth;
        
        this.callParent(arguments);
        
        var columnConfig    = this.columnConfig;
        var me              = this;
        var thisEl          = this.el;
        
        var top             = columnConfig.top;
        
        var sumTop          = 0;
        var sumMiddle       = 0;
        
        if (top) {
            thisEl.select('.sch-header-row-top').setWidth(this.getWidth());
            
            thisEl.select('.sch-header-row-top td').each(function (el, composite, index) {
                var width   = me.getHeaderGroupCellWidth(top[ index ].start, top[ index ].end);
                
                el.setVisibilityMode(Ext.Element.DISPLAY);
                
                if (width) {
                    sumTop += width;
                    
                    el.show();
                    el.setWidth(width);    
                } else {
                    el.hide();
                }
            });
        }
        
        var middle             = columnConfig.middle;
        
        if (middle) {
            thisEl.select('.sch-header-row-middle').setWidth(this.getWidth());
            
            thisEl.select('.sch-header-row-middle td').each(function (el, composite, index) {
                var width   = me.getHeaderGroupCellWidth(middle[ index ].start, middle[ index ].end);
                
                el.setVisibilityMode(Ext.Element.DISPLAY);
                
                if (width) {
                    sumMiddle += width;
                    
                    el.show();
                    el.setWidth(width);    
                } else {
                    el.hide();
                }
            });
        }
        
        var totalWidth      = sumTop || sumMiddle;
        
        if (totalWidth) {
            thisEl.setWidth(totalWidth);
            
            thisEl.select('table').each(function (el) {
                if (!el.hasCls('sch-nested-hdr-tbl')) {
                    el.setWidth(totalWidth);
                }
            });
        } else {
            thisEl.setWidth('auto');
            
            thisEl.select('table').each(function (el) {
                if (!el.hasCls('sch-nested-hdr-tbl')) {
                    el.setWidth('auto');
                }
            });
        }
    },
    
    
    getHeaderGroupCellWidth : function(start, end/*, headerRowUnit, headerRowIncrement*/) {
        var baseUnit                    = this.timeAxis.unit,
            baseIncrement               = this.timeAxis.increment,
            width,
            measuringUnit               = Sch.util.Date.getMeasuringUnit(baseUnit),
            durationInMeasuringUnit     = Sch.util.Date.getDurationInUnit(start, end, measuringUnit),
            schedulingView              = this.getSchedulingView();
        
        if (this.timeAxis.isContinuous()) {   
            width = durationInMeasuringUnit * schedulingView.getSingleUnitInPixels(measuringUnit) / baseIncrement;
        } else {
            width = schedulingView.getXYFromDate(end)[ 0 ] - schedulingView.getXYFromDate(start)[ 0 ];
        }
        
        if (!(Ext.isBorderBox || (Ext.isWebKit && !Ext.isSafari2))) {
            width -= 2;
        }
        
        return width;
    },
    
    
    onElDblClick: function (event, target) {
        this.callParent(arguments);
        
        var headerCell  = event.getTarget('.sch-column-header');
        
        if (headerCell) {
            var position    = Ext.fly(headerCell).getAttribute('headerPosition'),
                index       = Ext.fly(headerCell).getAttribute('headerIndex'),
                headerConfig  = this.columnConfig[ position ][ index ];
            
            this.fireEvent('timeheaderdblclick', this, headerConfig.start, headerConfig.end, event);
        }
    },
    
    
    getTimeColumnWidth : function () {
        if (this.columnWidth === null) {
            this.columnWidth = this.items.get(0).getWidth();
        }
        
        return this.columnWidth;
    },
    
    
    setTimeColumnWidth : function (width) {
        
        this.suspendLayout = true;
        
        this.items.each(function (column) {
//            if (column.componentLayout) delete column.componentLayout.lastComponentSize
//            
//            column.minWidth     = undefined;
//            column.width        = width;
            
            
            if (column.rendered) {
                // otherwise column "remembers" its width and doesn't update
                column.minWidth    = undefined;
            
                column.setWidth(width);
            }
        });
        
        this.suspendLayout = false;
        
        this.doLayout();
    }
});


/*
 * @class Sch.column.timeAxis.Vertical
 * @private
 * @extends Ext.grid.column.Column
 * A Column representing the time span in vertical orientation
 * @constructor
 * @param {Object} config The configuration options
 */
Ext.define('Sch.column.timeAxis.Vertical', {
    
    extend      : 'Ext.grid.column.Column',
    
    alias       : 'widget.verticaltimeaxis',
    

    /**
    * Default timeaxis column properties
    */
    align           : 'right',
    
    draggable       : false,
    groupable       : false,
    menuDisabled    : true,
    hideable        : false,
    sortable        : false,
    
    dataIndex       : 'start',
    
    timeAxis        : null,

    
    initComponent : function() {
        this.callParent(arguments);
        this.scope = this;
    },

    
    renderer : function(v, m, r) {
        var hConfig = this.timeAxis.headerConfig,
            hc = hConfig.bottom || hConfig.middle;

        if (hc.renderer) {
            return hc.renderer.call(hc.scope || this, v, r.data.end, m, 0);
        } else {
            return Ext.Date.format(v, hc.dateFormat);
        }
    }
});


Ext.define('Sch.patches.CellEditing', {
    extend      : "Sch.util.Patch",
    requires      : ["Ext.grid.plugin.CellEditing"],
    description : "PATCH for broken Ext cell editing",

    overrides : {
        // PATCH for broken Ext cell editing
        getEditor: function(record, column) {
            if (!column.getEditor) {
                return false;
            }
            return this.callOverridden(arguments);
        },

        // PATCH for broken Ext cell editing
        startEdit: function(record, columnHeader) {
            if (!columnHeader.getEditor) {
                return false;
            }
            this.callOverridden(arguments);
        }
    }
});

Ext.define('Sch.patches.Editing', {
    extend  : "Sch.util.Patch",
    requires  : ['Ext.grid.plugin.Editing'],
    
    overrides : {
        // 1. Render grid.
        // 2. Click cell
        // 3. Exception thrown 
        startEditByClick: function(view, cell, colIdx, record, row, rowIdx, e) {
            var header = view.getHeaderAtIndex(colIdx);
            if (header.getEditor && header.getEditor(record)) {
                this.startEdit(record, header);
            }
        }
    }
});

Ext.define('Sch.patches.GroupingFeature', {
    extend  : "Sch.util.Patch",
    requires : ['Ext.grid.feature.Grouping'],
    description : "Grouping not supported together with locked columns",
    
    overrides : {
    // Overridden to be able to pass group name as one of the fireEvent arguments (needed to have locked+normal groups in sync)
        expand: function(groupBd) {
            var me = this,
                view = me.view,
                grid = view.up('gridpanel'),
                groupBdDom = Ext.getDom(groupBd),
                groupName = groupBdDom.id.match(view.id + '-gp-(.*)')[1];
  
            me.collapsedState[groupBdDom.id] = false;

            groupBd.removeCls(me.collapsedCls);
            groupBd.prev().removeCls(me.hdCollapsedCls);

            grid.determineScrollbars();
            grid.invalidateScroller();
            view.fireEvent('groupexpand', view, groupName);
        },

    
        collapse: function(groupBd) {
            var me = this,
                view = me.view,
                grid = view.up('gridpanel'),
                groupBdDom = Ext.getDom(groupBd),
                groupName = groupBdDom.id.match(view.id + '-gp-(.*)')[1];
            
            me.collapsedState[groupBdDom.id] = true;

            groupBd.addCls(me.collapsedCls);
            groupBd.prev().addCls(me.hdCollapsedCls);

            grid.determineScrollbars();
            grid.invalidateScroller();
            view.fireEvent('groupcollapse', view, groupName);
        }
    }
});

Ext.define('Sch.patches.LockableMixin', {
    extend      : "Sch.util.Patch",
    requires    : ["Ext.grid.Lockable"],
    minVersion  : "4.0.6",
    maxVersion  : "4.0.6",
    reportUrl   : "http://www.sencha.com/forum/showthread.php?147345-4.0.6-Locking-grid-doesn-t-substract-width-of-hidden-locked-columns&s=b507e5ac67b7684671c71156ddc2b388",
    description : "Missing to substract the width of hidden locked columns",

    overrides : {
        processColumns: function (columns) {
            var res = this.callOverridden(arguments);
            
            Ext.each(columns, function (column) {
                if (column.locked && column.hidden) {
                    res.lockedWidth -= column.width || Ext.grid.header.Container.prototype.defaultWidth;
                }
            });
        
            return res;
        }
    }
});

Ext.define('Sch.patches.LoadMask', {
    extend  : "Sch.util.Patch",
    requires  : ['Ext.LoadMask'],
    minVersion : "4.0.6",
    description : '',

    overrides : {
        // for some reason this method uses `Ext.Component.prototype.show.call(me);` instead of me.show()
        // this however makes it easier to override
        onBeforeLoad : function() {
            var me = this,
                owner = me.ownerCt || me.floatParent;
            if (!this.disabled) {
                // If the owning Component has not been layed out, defer so that the ZIndexManager
                // gets to read its layed out size when sizing the modal mask
                if (owner.componentLayoutCounter) {
                    Ext.Component.prototype.show.call(me);
                } else {
                    owner.afterComponentLayout = Ext.Function.createSequence(owner.afterComponentLayout, function() {
                        // FIX
                        if (!me.hidden) Ext.Component.prototype.show.call(me);
                        // EOF FIX
                        delete owner.afterComponentLayout;
                    });
                }
            }
        }
    }
});

Ext.define('Sch.patches.Model', {
    extend  : "Sch.util.Patch",
    requires  : ['Ext.data.Model'],
    minVersion : "4.0.6",
    description : 'do not clear the "phantom" flag in commit',

    overrides : {
        
        commit : function(silent) {
            var me = this;
        
            /*MODIFICATION*//*me.phantom = */me.dirty = me.editing = false;
            me.modified = {};
        
            if (silent !== true) {
                me.afterCommit();
            }
        }    
    }
});

Ext.define('Sch.patches.NodeInterface', {
    requires : 'Ext.data.NodeInterface'
}, function() {
    
    // NodeInterface overrides.
    var original = Ext.data.NodeInterface.getPrototypeBody;

    Ext.data.NodeInterface.getPrototypeBody = function() {
        var retVal = original.apply(Ext.data.NodeInterface, arguments);
        
        Ext.apply(retVal, {
            updateInfo: function(silent) {
                var me = this,
                    isRoot = me.isRoot(),
                    parentNode = me.parentNode,
                    isFirst = (!parentNode ? true : parentNode.firstChild == me),
                    isLast = (!parentNode ? true : parentNode.lastChild == me),
                    depth = 0,
                    parent = me,
                    children = me.childNodes,
                    len = children.length,
                    i = 0,
                    data = me[me.persistenceProperty];

                while (parent.parentNode) {
                    ++depth;
                    parent = parent.parentNode;
                }                                            
            
                var change = {
                    isFirst: isFirst,
                    isLast: isLast,
                    depth: depth,
                    index: parentNode ? parentNode.indexOf(me) : 0,
                    parentId: parentNode ? parentNode.getId() : null
                };
                
                if (silent) {
                    Ext.apply(data, change);
                } else {
                    me.beginEdit();
                    me.set(change);
                    me.endEdit();
                }
            
                for (i = 0; i < len; i++) {
                    children[i].updateInfo(silent);
                }
            
                // update the `index` property of the siblings in the imperative style for performance reasons
                var currentNode     = me;
                var nextSibling     = currentNode.nextSibling;
            
                while (nextSibling && nextSibling.get('index') !== currentNode.get('index') + 1) {
                 
                    if (silent) {
                        nextSibling[ nextSibling.persistenceProperty ].index = currentNode.get('index') + 1;
                    } else {
                        nextSibling.set("index", currentNode.get('index') + 1);
                    }
                
                    currentNode     = nextSibling;
                    nextSibling     = currentNode.nextSibling;
                }
            },

            /**
                * Sorts this nodes children using the supplied sort function.
                * @param {Function} fn A function which, when passed two Nodes, returns -1, 0 or 1 depending upon required sort order.
                * @param {Boolean} recursive Whether or not to apply this sort recursively
                * @param {Boolean} suppressEvent Set to true to not fire a sort event.
                */
            sort : function(sortFn, recursive, suppressEvent) {
                var cs  = this.childNodes,
                    ln = cs.length,
                    i, n;
            
                if (ln > 0) {
                    Ext.Array.sort(cs, sortFn);
                    for (i = 0; i < ln; i++) {
                        n = cs[i];
                        n.previousSibling = cs[i-1];
                        n.nextSibling = cs[i+1];
                    }
                
                    for (i = 0; i < ln; i++) {
                        n = cs[i];
                
                        if (i === 0) {
                            this.setFirstChild(n);
                            n.updateInfo();
                        }
                        if (i == ln - 1) {
                            this.setLastChild(n);
                            n.updateInfo();
                        }
                        if (recursive && !n.isLeaf()) {
                            n.sort(sortFn, true, true);
                        }
                    }
                
                    if (suppressEvent !== true) {
                        this.fireEvent('sort', this, cs);
                    }
                }
            }
        });
    
        return retVal;
    };
});

Ext.define('Sch.patches.Operation', {
    extend  : "Sch.util.Patch",
    requires : ['Ext.data.Operation'],
    minVersion : "4.0.6",

    overrides : {
        commitRecords: function (serverRecords) {
            var me = this,
                mc, index, clientRecords, serverRec, clientRec;
        
            if (!me.actionSkipSyncRe.test(me.action)) {
                clientRecords = me.records;
        
                if (clientRecords && clientRecords.length) {
                    mc = Ext.create('Ext.util.MixedCollection', true, function(r) {return r.getId();});
                    mc.addAll(clientRecords);
        
                    for (index = serverRecords ? serverRecords.length : 0; index--; ) {
                        serverRec = serverRecords[index];
                        clientRec = mc.get(serverRec.getId());
        
                        var newData = {};
                            
                        serverRec.fields.each(function (field) {
                            if (field.persist) newData[ field.name ] = serverRec.data[ field.name ];
                        });
                            
                        if (clientRec) {
                            clientRec.beginEdit();
                            clientRec.set(newData);
                            clientRec.endEdit(true);
                        }
                    }
        
                    if (me.actionCommitRecordsRe.test(me.action)) {
                        for (index = clientRecords.length; index--; ) {
                            clientRecords[index].commit();
                        }
                    }
                }
            }
        }
    }
});

Ext.define('Sch.patches.TablePanel', {
    extend  : "Sch.util.Patch",
    requires : ['Ext.panel.Table'],
    maxVersion : "4.0.7",
    reportUrl : "http://www.sencha.com/forum/showthread.php?136776-4.0.2-panel.Table-scrollByDeltaX-method-not-working",

    overrides : {
        // Sometimes during drag drop grid tries to scroll when there is no virtual scroller component present.
        elScroll: function(direction, distance, animate) {
            var me = this,
                scroller;

            if (direction === "up" || direction === "right") {
                distance = -distance;
            }

            if (direction === "down" || direction === "up") {
                scroller = me.getVerticalScroller();
                scroller && scroller.scrollByDeltaY(distance);
            } else {
                scroller = me.getHorizontalScroller();
                scroller && scroller.scrollByDeltaX(distance);
            }
        },

        scrollByDeltaX: function(deltaX) {
            var horizontalScroller = this.getHorizontalScroller();

            if (horizontalScroller) {
                horizontalScroller.scrollByDeltaX(deltaX);
            }
        }
    }
});
Ext.define('Sch.patches.TreePanel', {
    extend  : "Sch.util.Patch",
    requires : ['Ext.tree.Panel'],
    description : 'Tree does not support locked columns',
    reportUrl : 'http://www.sencha.com/forum/showthread.php?137688-4.0.2a-Race-condition-in-doAdd-doRemove-of-Ext.tree.View&p=616184#post616184',
    
    // this was actually not enough as the same thing was happening in "onExpand/onCollapse"
    // (`resetScrollers` were refreshing a whole view thus breaking all the intermediate state of various handlers)
    // so we are now using a buffered verstion of `resetScrollers` in `Sch.view.TimelineTreeView`
    
    overrides : {
        isContainerPanel : function() {
            return !this.items || !!this.child('treepanel');
        },

        onRootChange: function(root) {
            if (!this.isContainerPanel()) {
                this.callOverridden(arguments);
            }
        },

        constructor: function(config) {
            this.callParent([config || {}]);

            this.onRootChange(this.store.getRootNode());// PATCH
        }
    }
});

Ext.define('Sch.patches.TreeStore', {
    extend      : "Sch.util.Patch",
    requires      : ['Ext.data.TreeStore'],
    minVersion  : "4.0.7",
    reportURL : 'http://www.sencha.com/forum/showthread.php?151211-Reloading-TreeStore-adds-all-records-to-store-getRemovedRecords&p=661157#post661157',

    overrides : {
            
        // do not destroy records, removed from store, when doing "clearOnLoad"
        // destroy generate requests to server, which is not really what the user mean
        load: function(options) {
            options = options || {};
            options.params = options.params || {};
        
            var me = this,
                node = options.node || me.tree.getRootNode(),
                root;
        
            // If there is not a node it means the user hasnt defined a rootnode yet. In this case lets just
            // create one for them.
            if (!node) {
                node = me.setRootNode({
                    expanded: true
                });
            }
        
            if (me.clearOnLoad) {
                node.removeAll(/*true*/); /*MODIFICATION, this line should ideally be wrapped in suspendEvents for the node for performance reasons*/
            }
        
            Ext.applyIf(options, {
                node: node
            });
            options.params[me.nodeParam] = node ? node.getId() : 'root';
        
            if (node) {
                node.set('loading', true);
            }
        
            return me.callParent([options]);
        }        
    }
});

Ext.define('Sch.patches.TreeStoreIE', {
    extend  : "Sch.util.Patch",
    requires : ['Ext.data.TreeStore'],
    description : 'IE breaks when loading nested xml nodes',
    ieOnly : true,

    overrides : {
        onNodeAdded: function(parent, node) {
            var proxy = this.getProxy(),
                reader = proxy.getReader(),
                data = node.raw || node.data,
                dataRoot, children;
            
            Ext.Array.remove(this.removed, node); 
        
            if (!node.isLeaf() && !node.isLoaded()) {
                dataRoot = reader.getRoot(data);
                if (dataRoot) {
                    this.fillNode(node, reader.extractData(dataRoot));
                    if (data[reader.root]) {
                        delete data[reader.root];
                    }
                }
            }
        }
    }
});

Ext.define('Sch.patches.TreeView', {
    extend  : "Sch.util.Patch",
    requires : ['Ext.tree.View'],
    description : "To enable the usage of the same NodeStore in both TreeViews for locking tree", 
    
    // also to be able to configure the NodeStore being created
    overrides : {
        providedStore       : null, 
        storeConfig         : null,
    
        initComponent: function() {
            var me = this;
            
            if (me.initialConfig.animate === undefined) {
                me.animate = Ext.enableFx;
            }
            
            me.store = me.providedStore || Ext.create('Ext.data.NodeStore', Ext.apply({
                recursive: true,
                rootVisible: me.rootVisible,
                listeners: {
                    beforeexpand: me.onBeforeExpand,
                    expand: me.onExpand,
                    beforecollapse: me.onBeforeCollapse,
                    collapse: me.onCollapse,
                    scope: me
                }
            }, me.storeConfig || {}));
            
            // if the tree was given a store, then still subscribes to expand/collapse events
            if (me.providedStore) {
                me.providedStore.on({
                    beforeexpand    : me.onBeforeExpand,
                    expand          : me.onExpand,
                    
                    beforecollapse  : me.onBeforeCollapse,
                    collapse        : me.onCollapse,
                    
                    scope           : me
                });
            }
            
            if (me.node) {
                me.setRootNode(me.node);
            }
            me.animQueue = {};
            me.callParent(arguments);
        }
    }
});

Ext.define("Sch.patches.XmlReader", {
    extend : "Sch.util.Patch",
    requires : ["Ext.data.reader.Xml"],
    description : 'IE cannot handle loading nested XML',
    reportURL : "http://www.sencha.com/forum/showthread.php?136404-INFOREQ-4.0.2-RC3-Returning-nested-XML-data-for-a-Tree-doesn-t-work...",

    overrides : {
        extractData: function(root) {
            var recordName = this.record;
        
            if (recordName != root.nodeName) {
                root = Ext.DomQuery.select('>' + recordName, root);
            } else {
                root = [root];
            }
            return this.callParent([root]);
        }
    }
});

// Private
Ext.define('Sch.mixin.Lockable', {
    extend          : 'Ext.grid.Lockable',
    
    requires        : [
        'Sch.patches.LockableMixin',
        'Sch.column.timeAxis.Horizontal'    
    ],

    // Simple object describing if and how features will be cascaded to child grid panels
    inheritableStatics : {
        featureCascadeMap : {
            "Ext.grid.feature.Grouping" : 'both'
        },
        pluginCascadeMap : {
            "Ext.grid.plugin.Editing" : 'locked'
        }
    },

    processPlugins : function(plugins) {
        plugins = plugins || [];
        
        var me = this,
            map = me.statics().pluginCascadeMap,
            len = plugins.length,
            locked = [],
            normal = [],
            nbrKeys = 0,
            i = 0;

        for (i = len-1; i >= 0; i--) {
            for (var o in map) {
                if (!plugins[i].ptype) {
                    // Instance of a plugin
                    if (plugins[i] instanceof Ext.ClassManager.get(o)) {
                        if (map[o] === 'locked' || map[o] === 'both') {
                            locked.push(plugins[i]);
                        }
                        if (map[o] === 'normal' || map[o] === 'both') {
                            normal.push(new plugins[i].self());
                        }
                        Ext.Array.remove(plugins, plugins[i]);
                    }
                } else {
                    // Plugin config object with ptype
                    normal.push(Ext.clone(plugins[i]));
                }
            }
        }

        return {
            locked : locked,
            normal : normal
        };
    },

    processFeatures : function(features) {
        features = features || [];
        
        var me = this,
            map = me.statics().featureCascadeMap,
            len = features.length,
            locked = [],
            normal = [],
            nbrKeys = 0,
            i = 0;

        for (i = len-1; i >= 0; i--) {
            for (var o in map) {
                if (features[i].isFeature) {
                    if (features[i] instanceof Ext.ClassManager.get(o)) {
                        if (map[o] === 'locked' || map[o] === 'both') {
                            locked.push(features[i]);
                        }
                        if (map[o] === 'normal' || map[o] === 'both') {
                            normal.push(new features[i].self());
                        }
                        Ext.Array.remove(features, features[i]);
                    }
                } else {
                    normal.push(Ext.clone(features[i]));
                }
            }
        }

        return {
            locked : locked,
            normal : normal
        };
    },

    // overridden
    injectLockable: function() {
        
        // 4.0.5 compatibility
        this.createSpacer       = this.createSpacer || Ext.emptyFn;

        var processedFeatures   = this.processFeatures(this.features),
            processedPlugins    = this.processPlugins(this.plugins);

        this.hasView            = true;
        
        var me                  = this;
        var isTree              = me.store instanceof Ext.data.TreeStore;
        var isBuffered          = me.store.buffered;
        
        me.normalViewConfig     = me.normalViewConfig || {};
        me.lockedViewConfig     = me.lockedViewConfig || {};
        
        
        var selModel        = me.getSelectionModel(),
            eventSelModel   = me.getEventSelectionModel ? me.getEventSelectionModel() : selModel,
            
            lockedGrid      = Ext.applyIf({
                xtype           : me.lockedXType,
                columnLines     : me.columnLines,
                lockable        : false,
                
                // in the vertical orientation, the `deferRowRender` feature re-renders the locked grid w/o synchronization somehow
                // however w/o, the column position example is broken
                // so disabling it only for vertical orientation
//                deferRowRender  : false, //this.orientation != 'vertical',
                deferRowRender  : me.deferRowRender,
                
                useArrows       : true,    // HACK
                
                
                
                invalidateScroller      : Ext.emptyFn,   // HACK, tree panel sometimes sets its width to 1px 
                resetScrollbars         : Ext.emptyFn,      // HACK, tree panel sometimes sets its width to 1px 
                determineScrollbars     : Ext.emptyFn,  // HACK, tree panel sometimes sets its width to 1px
                
                enableAnimations        : false,
                
                scroll          : false,
                scrollerOwner   : false,
                
                selModel        : selModel,
                
                border          : false,
                cls             : Ext.baseCSSPrefix + 'grid-inner-locked',
                
                plugins         : processedPlugins.locked,
                features        : processedFeatures.locked
                
            }, me.lockedGridConfig || {}),
            
            normalGrid = Ext.applyIf({
                xtype           : me.normalXType,
                columnLines     : me.columnLines,
                lockable        : false,
                
                deferRowRender  : me.deferRowRender,
                
                verticalScroller    : me.verticalScroller,
                
                selModel            : eventSelModel, 
                
                border              : false,
                
                enableAnimations    : false,
                scrollerOwner       : false,
                trackOver           : false,
                _top                : me,
                
                orientation         : this.orientation,
                weekStartDay        : this.weekStartDay,
                viewPreset          : me.viewPreset || 'hourAndDay',
                timeAxis            : me.timeAxis,
                
                startDate           : me.startDate,
                endDate             : me.endDate,
                
                plugins             : processedPlugins.normal,
                features            : processedFeatures.normal
                
            }, me.schedulerConfig || {}),
            
            i = 0,
            columns,
            lockedHeaderCt,
            normalHeaderCt;
            
        delete me.verticalScroller;
            
        me.addCls(Ext.baseCSSPrefix + 'grid-locked');
        
        
        Ext.copyTo(normalGrid, me, me.normalCfgCopy);
        Ext.copyTo(lockedGrid, me, me.lockedCfgCopy);
        for (; i < me.normalCfgCopy.length; i++) {
            delete me[me.normalCfgCopy[i]];
        }
        for (i = 0; i < me.lockedCfgCopy.length; i++) {
            delete me[me.lockedCfgCopy[i]];
        }
        
        me.lockedHeights        = [];
        me.normalHeights        = [];
        
        if (me.orientation === 'vertical') {
            lockedGrid.columns = [
                Ext.create('Sch.column.timeAxis.Vertical', Ext.apply({
                    width       : 100,
                    timeAxis    : me.timeAxis,
                    locked      : true
                }, this.timeAxisColumnCfg || {}))
            ];
            columns                     = me.processColumns(lockedGrid.columns);
            lockedGrid.store            = normalGrid.store = me.timeAxis.tickStore;
            
            normalGrid.resourceStore    = me.resourceStore;
            
            me.resourceStore.on({
                clear       : this.refreshResourceColumns,
                datachanged : this.refreshResourceColumns,
                load        : this.refreshResourceColumns,
                
                scope       : this
            });
            
            
        } else {
            normalGrid.resourceStore    = me.resourceStore;
            
            columns                     = me.processColumns(me.columns);
            
            lockedGrid.store            = normalGrid.store = me.store;
            lockedGrid.columns          = columns.locked;
            normalGrid.columns          = [
                {
                    xtype               : 'timeaxiscolumn',
                    timeAxis            : me.timeAxis,
                    viewPreset          : me.viewPreset || 'hourAndDay',
                    
                    timeCellRenderer        : me.timeCellRenderer,
                    timeCellRendererScope   : me.timeCellRendererScope
                }
            ].concat(columns.right);
        }
        
        if (!lockedGrid.flex && !lockedGrid.width) {
            lockedGrid.width = columns.lockedWidth;
        }

        // HACK, only used in Scheduler
        if (me.eventStore) {
            normalGrid.eventStore = me.eventStore;
        }

        // HACK, only used in Gantt
        if (me.dependencyStore) {
            normalGrid.dependencyStore = me.dependencyStore;
        }

        
        if (me.layout === 'fit') {
            me.layout = {
                type        : 'hbox',
                align       : 'stretch'
            };
            normalGrid.flex = normalGrid.flex || 1;
        }

        lockedGrid.viewConfig = me.lockedViewConfig;
        lockedGrid.viewConfig.loadingUseMsg = false;
        normalGrid.viewConfig = me.normalViewConfig;

        Ext.applyIf(lockedGrid.viewConfig, me.viewConfig);
        Ext.applyIf(normalGrid.viewConfig, me.viewConfig);

        
        if (isTree && isBuffered) {
            lockedGrid.viewConfig.storeConfig = {
                buffered        : true,
                pageSize        : me.store.pageSize || 50,
                
                // never purge any data, we prefetch all up front
                purgePageCount  : 0,
                
                refreshFromTree : function () {
                    var eventsWereSuspended     = this.eventsSuspended;
                    
                    this.suspendEvents();
                    
                    this.removeAll();
                    this.prefetchData.clear();
                    
                    var root            = me.store.getRootNode(),
                        linearNodes     = [];
                    
                    var cascadeBy       = function (node, func) {
                        func(node);
                        
                        if (node.isExpanded()) {
                            var childNodes  = node.childNodes,
                                length      = childNodes.length;
                            
                            for (var k = 0; k < length; k++) {
                                cascadeBy(childNodes[ k ], func);
                            }
                        }
                    };
                    
                    cascadeBy(root, function (node) {
                        if (node != root) {
                            linearNodes.push(node);
                        }
                    });
                    
                    this.cacheRecords(linearNodes);
                    
                    this.totalCount = this.prefetchData.getCount();
                    
                    if (!eventsWereSuspended) {
                        this.resumeEvents();
                    }
                }
            };
        }
        
        // Grids instantiation
        
        me.lockedGrid       = Ext.ComponentManager.create(lockedGrid);
        
        var lockedView      = me.lockedGrid.getView();
        
        if (isTree) {
            // re-using the NodeStore for the normal grid
            normalGrid.viewConfig.providedStore = lockedView.store;
            
            if (isBuffered && normalGrid.verticalScroller) {
                normalGrid.verticalScroller.store   = lockedView.store;
            }
        }
        me.normalGrid = Ext.ComponentManager.create(normalGrid);
        
        // EOF Grids instantiation

       
        me.view = Ext.create('Sch.view.Locking', {
            locked  : me.lockedGrid,
            normal  : me.normalGrid,
            panel   : me    
        });
        
//        just call the `onLockedGridAfterLayout` directly
//        instead of `me.lockedGrid.on('afterlayout', me.onLockedGridAfterLayout, me, {single: true});`
//        inside of this method there will be a subscription to `refresh` event which should be 1st!
        me.onLockedGridAfterLayout();

        
        var normalView      = me.normalGrid.getView();
        var normalStore     = normalView.store;
        
        // `refreshResourceColumns` requires the presence of scheduling view, so can do this only here
        // after normalView creation
        if (me.orientation === 'vertical') {
            this.refreshResourceColumns(true);
        }
        
        
        if (me.syncRowHeight) {
            
            lockedView.on({
                refresh     : me.onLockedGridAfterRefresh,
                itemupdate  : me.onLockedGridAfterUpdate,
                scope       : me
            });

            normalView.on({
                refresh     : me.onNormalGridAfterRefresh,
                itemupdate  : me.onNormalGridAfterUpdate,
                // required for tree
                itemadd     : me.onNormalGridAfterAdd,
                
                afterrender : me.createSpacer,
                
                scope       : me
            });
        }
        
        lockedHeaderCt = me.lockedGrid.headerCt;
        normalHeaderCt = me.normalGrid.headerCt;
        
        lockedHeaderCt.lockedCt = true;
        lockedHeaderCt.lockableInjected = true;
        normalHeaderCt.lockableInjected = true;
        
        lockedHeaderCt.on({
            columnshow: me.onLockedHeaderShow,
            columnhide: me.onLockedHeaderHide,
            columnmove: me.onLockedHeaderMove,
            sortchange: me.onLockedHeaderSortChange,
            columnresize: me.onLockedHeaderResize,
            scope: me
        });
        
        // @REVIEW_4.1 adds a "spacer" - an additional row in the locked part which synchronize the height  
        me.normalGrid.on({
            scrollershow: me.onScrollerShow,
            scrollerhide: me.onScrollerHide,
            scope: me
        });

        // @REVIEW_4.1
//        no reason to wait for layout - the spacer creation should be done in the 1st listener of `refresh`
//        so moving the subscription higher  
//        me.lockedGrid.on('afterlayout', me.onLockedGridAfterLayout, me, {single: true});
        
        if (Ext.versions.extjs.isLessThan("4.1.0")) {
            me.normalGrid.headerCt.on('afterlayout', this.onSchedulerGridAfterHeaderLayout, this);
        }

        me.modifyHeaderCt();
        me.items = [me.lockedGrid, me.normalGrid];
        
        var oldRootNode;
        var fillingRoot;
        
        if (isTree) {
            var treeStore   = me.store;
            
            // the store of normal view wins (since its the last who will join the records)
            // we need to translate the "update" event to top store to track the updates
            // OWN_UPDATE
//            treeStore.relayEvents(normalStore, [
//                'update'
//            ]);
            
            var guaranteeRange = function (rangeStart, rangeEnd) {
                var pageSize    = treeStore.pageSize || 50;
                var totalCount  = normalStore.prefetchData.getCount();
                
                if (totalCount) {
                    var rangeLength     = rangeEnd - rangeStart + 1;
                    
                    // if current range is less than a page size but in total we have at least the page records
                    if (rangeLength < pageSize && totalCount >= rangeLength) {
                        
                        // then expand the range till the page size
                        rangeEnd    = rangeStart + pageSize - 1;
                    }
                    
                    // if the end of range goes after limit
                    if (rangeEnd >= totalCount) {
                        // then adjust it
                        rangeStart  = totalCount - (rangeEnd - rangeStart);
                        rangeEnd    = totalCount - 1;
                         
                        rangeStart  = Math.max(0, rangeStart);
                    }
                    
                    normalStore.guaranteeRange(rangeStart, rangeEnd);
                }
            };
            
            treeStore.on('root-fill-start', function () {
                fillingRoot = true;
                
                normalStore.suspendEvents();
                
                if (isBuffered) {
                    oldRootNode = normalStore.node;
                    
                    // setting the root node of NodeStore to null - so we now should update the NodeStore manually for all CRUD operations in tree
                    // with `refreshFromTree` call
                    normalStore.setNode();
                }
            });
            
            treeStore.on('root-fill-end', function () {
                fillingRoot = false;
                
                if (isBuffered) {
                    normalStore.refreshFromTree();

                    normalStore.resumeEvents();
                    
                    guaranteeRange(0, (treeStore.pageSize || 50) - 1);
                    
                    me.getView().refresh();
                } else {
                    normalStore.resumeEvents();
                    me.getView().refresh();
                }
            });
            
            if (isBuffered) {
                normalStore.on('bufferchange', function () { me.getView().refresh(); });
                
                var updateNodeStore = function () {
                    if (fillingRoot) return;
                    
                    normalStore.refreshFromTree();
                    
                    var rangeStart  = normalStore.guaranteedStart,
                        rangeEnd    = normalStore.guaranteedEnd;
                    
                    delete normalStore.guaranteedStart;
                    delete normalStore.guaranteedEnd;
                    
                    guaranteeRange(rangeStart, rangeEnd);
                    
                    me.getView().refresh();
                };
                
                treeStore.on({
                    append      : updateNodeStore,
                    insert      : updateNodeStore,
                    remove      : updateNodeStore,
                    move        : updateNodeStore,
                    expand      : updateNodeStore,
                    collapse    : updateNodeStore,
                    sort        : updateNodeStore,
                    
                    buffer      : 1
                });
            }
            
            treeStore.on('filter', function (treeStore, args) {
                normalStore.filter.apply(normalStore, args);
                
                me.getView().refresh();
            });
            
            treeStore.on('clearfilter', function (treeStore) {
                normalStore.clearFilter();
                
                me.getView().refresh();
            });
            
            // TODO this should be moved to gantt, no cascade functionality in scheduler
            treeStore.on('beforecascade', function (treeStore) {
                normalStore.suspendEvents();
            });
            
            // TODO this should be moved to gantt, no cascade functionality in scheduler
            treeStore.on('cascade', function (treeStore, context) {
               
                normalStore.resumeEvents();
                
                if (context.nbrAffected > 0) {
                    me.getView().refresh();
                }
            });
        }

        // HACK Sync group expand/collapse for the two views.
        if (typeof this.onViewGroupExpand !== "undefined") {
            lockedView.on({
                groupexpand     : this.onViewGroupExpand,
                groupcollapse   : this.onViewGroupCollapse,
            
                scope           : normalView
            });
            normalView.on({
                groupexpand     : this.onViewGroupExpand,
                groupcollapse   : this.onViewGroupCollapse,
            
                scope           : lockedView
            });
        }
        me.on('afterlayout', this.onLockableGridAfterLayout, this, { single : true });

        if (me.relayHeaderCtEvents) {
            me.relayHeaderCtEvents(lockedHeaderCt);
            me.relayHeaderCtEvents(normalHeaderCt);
        }
    },

    // additional call to 'doLayout' required starting from 4.0.2a
    onLockableGridAfterLayout : function () {
        var height  = this.lockedGrid.getView().height;
        
        if (!height || height == 1) {
            this.doLayout();
        }
    },

    
    onNormalGridAfterUpdate : function(record, index, node) {
        this.lockedGrid.getView().onUpdate(this.lockedGrid.store, record);
        if (Ext.versions.extjs.isGreaterThan("4.0.7")) {
            // Row height must be synced manually
            var row = this.normalGrid.getView().getNode(index);
            row.style.height = node.style.height;
            this.normalHeights[index] = row.clientHeight;
        } else {
            this.normalHeights[index] = node.clientHeight;
        }
        this.syncRowHeights();
    },
    
    
    onNormalGridAfterAdd : function (records, index, nodes) {
        var normalHeights   = this.normalHeights;    
        var lockedView      = this.lockedGrid.getView();
        
        Ext.each(records, function (record, idx) {
            normalHeights[ lockedView.getNode(record).viewIndex ] = nodes[ idx ].offsetHeight;
        });
        
        this.syncRowHeights();
    },
    
    
    processColumns: function (columns) {
        var res                 = this.callParent(arguments);
        var rightColumns        = [];
        
        Ext.each(columns, function (column) {
            if (column.position == 'right') {
                if (!Ext.isNumber(column.width)) {
                    Ext.Error.raise('"Right" columns must have a fixed width');
                }
                rightColumns.push(column);
                Ext.Array.remove(res.locked, column);
                
                // Adjust the locked width since 'right' columns (which Ext JS is knows nothing of) are not part of the locked section.
                res.lockedWidth -= column.width;
            }
        });
        
        res.right = rightColumns;
        
        return res;
    },
    
    
    onNormalGridAfterRefresh : function () {
        if (this.normalGrid.layout.layoutBusy) {
            // ignore this event during layouting process (might be triggered by `setTimeColumnWidth` call 
            return;
        }
        
        return this.callParent(arguments);
    },
    

    syncRowHeights: function() {
        var me = this,
            lockedHeights = me.lockedHeights,
            normalHeights = me.normalHeights,
            calcHeights   = [],
            ln = lockedHeights.length || normalHeights.length,
            i  = 0,
            lockedView, normalView,
            lockedRowEls, normalRowEls,
            vertScroller = me.getVerticalScroller();
        
        if (lockedHeights.length || normalHeights.length) {
            lockedView = me.lockedGrid.getView();
            normalView = me.normalGrid.getView();

            if (!lockedView.rendered || !normalView.rendered) {
                return;
            }
            lockedRowEls = lockedView.el.query(lockedView.getItemSelector());
            
            if (!lockedRowEls.length) {
                return;
            }
            
            var delta   = (Ext.isIE6 || Ext.isIE7) && Ext.isStrict ? 2 : 0; 
            
            for (; i < ln; i++) {
                if (!isNaN(normalHeights[i])) {
                    Ext.fly(lockedRowEls[i]).setHeight(normalHeights[i] - delta);
                }
            }
            me.normalGrid.determineScrollbars();
            me.normalGrid.invalidateScroller();
            
            if (vertScroller && vertScroller.setViewScrollTop) {
                vertScroller.setViewScrollTop(me.virtualScrollTop);
            } else {
                me.setScrollTop(lockedView.el.dom.scrollTop);
            }
            
            me.lockedHeights = [];
            me.normalHeights = [];
        }
    },

    // Don't add locking/unlocking menu actions
    getMenuItems : function() {
        return function() {
            return Ext.grid.header.Container.prototype.getMenuItems.call(this);
        };
    },
    
    
    // TODO check if this is still required in 4.1
    // still required in 4.0.6
    // Nickolay TODO: add an inverse check - if the "locked" header height is bigger than "locked" header height
    onSchedulerGridAfterHeaderLayout : function () {
        var lockedHeaderCt  = this.lockedGrid.headerCt;
        var normalHeaderCt  = this.normalGrid.headerCt;
        
        var me              = this;
        
        if (Ext.versions.extjs.isGreaterThan("4.0.5")) {
            if (!this.__buffer__) {
                // first let the ExtJS to (possibly) break it
                this.__buffer__ = setTimeout(function () {
                    delete me.__buffer__;
                    
                    if (lockedHeaderCt.rendered) {
                        var innerEl = lockedHeaderCt.el.down('.x-box-inner');
                        
                        // in an edge case the component can be destroyed right before this handler
                        if (innerEl) {
                            innerEl.setHeight('100%');
                        }
                    }
                }, 0);
            }
                
            // this fixes #93, and part 2 of #99 - somehow grid "remembers" its previous size and does not resize unless we remove it
            delete this.lockedGrid.componentLayout.lastComponentSize;
            
        } else {
            
            // need to reset the height for "inner" el (which is set in `setPadding`)
            lockedHeaderCt.items.each(function (column) {
                if (column.rendered) {
                    column.el.down('.x-column-header-inner').setHeight('auto');
                }
            });
            
            // this will strecth the child columns to the container (not to the highest column)
            lockedHeaderCt.layout.align     = 'stretch';
            lockedHeaderCt.height           = undefined;
            
            // this fixes #93 - somehow grid "remembers" its previous size and do not resize unless
            delete this.lockedGrid.componentLayout.lastComponentSize;
            
            lockedHeaderCt.setSize(lockedHeaderCt.getWidth(), normalHeaderCt.getHeight());
            
            // required, since the call to `setPadding` in the "afterLayout" of the column layout is only performed
            // for "stretchmax" align (wonder why)
            lockedHeaderCt.items.each(function (column) {
                if (column.rendered) {
                    column.setPadding();
                }
            });
        }
    }
}, function() {
    
    // PATCHES
    if (Ext.isIE9 && Ext.isStrict) {
        // Default implementation broken for IE9
        Sch.mixin.Lockable.override({
            onNormalGridAfterRefresh: function() {
                var me     = this,
                    view   = me.normalGrid.getView(),
                    el     = view.el,
                    rowEls = el.query(view.getItemSelector()),
                    ln     = rowEls.length,
                    i = 0;
            
                me.normalHeights = [];
        
                for (; i < ln; i++) {
                    me.normalHeights[i] = rowEls[i].offsetHeight;
                }
                me.syncRowHeights();
            },

            onNormalGridAfterUpdate: function(record, index, node) {
                this.lockedGrid.getView().onUpdate(this.lockedGrid.store, record);
                if (Ext.versions.extjs.isGreaterThan("4.0.7")) {
                    // Row height must be synced manually
                    var row = this.normalGrid.getView().getNode(index);
                    row.style.height = node.style.height;
                    this.normalHeights[index] = row.offsetHeight;
                } else {
                    this.normalHeights[index] = node.offsetHeight;
                }
                this.syncRowHeights();
            }
        });
    }
});
/**

@class Sch.model.Range
@extends Ext.data.Model

This class represent a simple date range. Its being used in various plugins which operate on ranges. It is a subclass of the {@link Ext.data.Model}.
Please refer to {@link Ext.data.Model} documentation to become familar with the base interface of this class.

Range has the following fields:

- `StartDate` - start date of the task in the ISO 8601 format
- `EndDate` - end date of the task in the ISO 8601 format (not inclusive)
- `Cls` - an optional CSS class to be associated with the range. Default value is 'sch-daterange'

*/
Ext.define('Sch.model.Range', {
    extend      : 'Ext.data.Model',
    
    requires    : [
        'Sch.util.Date'
    ],
    
    fields      : [
        { name      : 'StartDate',  type    : 'date', dateFormat : 'c' },
        { name      : 'EndDate',    type    : 'date', dateFormat : 'c' },
        {   
            name            : 'Cls',
            defaultValue    : 'sch-daterange'
        }
    ],
    
    
    /**
     * Returns an array of dates in this range. If the range starts/ends not at the beginning of day, the whole day will be included.
     * @return {Array[Date]}
     */
    getDates : function () {
        var dates   = [],
            endDate = this.get('EndDate');
        
        for (var date = Ext.Date.clearTime(this.get('StartDate'), true); date < endDate; date = Sch.util.Date.add(date, Sch.util.Date.DAY, 1)) {
            
            dates.push(date);
        }
        
        return dates;
    },
    
    
    /**
     * Iterates over the results from {@link #getDates}
     * @param {Function} func The function to call for each date
     * @param {Object} scope The scope to use for the function call
     */
    forEachDate : function (func, scope) {
        return Ext.each(this.getDates(), func, scope);
    }
});
/**

@class Sch.model.Event
@extends Ext.data.Model

This class represent a single event in your schedule. It is a subclass of the {@link Ext.data.Model}.
Please refer to {@link Ext.data.Model} documentation to become familar with the base interface of the task.

The Event model has a few predefined fields as seen below. If you want to add new fields or change the options for the existing fields,
you can do that by subclassing this class (see example below). 

Fields
------

- `Id` - (mandatory) unique identificator of task
- `Name` - name of the task (task title)
- `StartDate` - start date of the task in the ISO 8601 format
- `EndDate` - end date of the task in the ISO 8601 format,
- `ResourceId` - The id of the associated resource

Subclassing the Event model class
--------------------

    Ext.define('MyProject.model.Event', {
        extend      : 'Sch.model.Event',
        
        fields      : [
            // adding new field
            { name: 'MyField', type : 'number', defaultValue : 0 }
        ],
        
        myCheckMethod : function () {
            return this.get('MyField') > 0 
        },
        ...
    });

If you want to use other names for the StartDate, EndDate, ResourceId and Name fields you can configure them as seen below:

    Ext.define('MyProject.model.Event', {
        extend      : 'Sch.model.Event',
        resourceIdField : 'userId',
        startDateField  : 'taskStart',
        endDateField    : 'taskEnd',
        nameField       : 'taskTitle',

        fields      : [
            { name: 'taskStart', type: 'date', dateFormat : 'Y-m-d' },
            { name: 'taskEnd', type: 'date', dateFormat : 'Y-m-d' },
            
            { name: 'taskTitle' },
            
            { name: 'userId' }
        ]
        ...
    });
*/
Ext.define('Sch.model.Event', {
    extend : 'Ext.data.Model',
    idProperty : 'Id',

    fields : [
        { name : 'Id' },
        { name : 'ResourceId' },
        { name : 'StartDate', type : 'date', dateFormat : 'c' }, // To learn about date format codes, visit http://docs.sencha.com/ext-js/4-0/#/api/Ext.Date
        { name : 'EndDate', type : 'date', dateFormat : 'c' },
        { name : 'Name' },
        { name : 'Cls' }
    ],

    // Here we add the default fields if client did not include fields for the required properties:
    // StartDate, EndDate, ResourceId, Name (and the idProperty)
    onClassExtended: function(cls, data) {
        
        // HACK, is there a cleaner way to call parent class onClassExtended on Ext.data.Model?
        Ext.data.Model.prototype.$onExtended.apply(this, arguments);
        var me = this,
            onClassCreated = data.onClassCreated;

        data.onClassCreated = function(cls) {
            
            var prot = cls.prototype,
                sup = cls.superclass;

            // First clear the superclass fields
            sup.fields.eachKey(function(k) {
                if (!prot.fields.getByKey(k)) {
                    prot.fields.removeAtKey(k);
                }
            });

            // Now see which fields need to be added
            var endDateField = prot.endDateField || sup.endDateField;
            var startDateField = prot.startDateField || sup.startDateField;
            var nameField = prot.nameField || sup.nameField;
            var resourceIdField = prot.resourceIdField || sup.resourceIdField;
            var clsField = prot.clsField || sup.clsField;
            var idProperty = prot.idProperty || sup.idProperty;

            if (!prot.fields.getByKey(endDateField)) {
                prot.fields.add(endDateField, new Ext.data.Field({ name : endDateField, type : 'date', dateFormat : 'c' }));
            }

            if (!prot.fields.getByKey(startDateField)) {
                prot.fields.add(startDateField, new Ext.data.Field({ name : startDateField, type : 'date', dateFormat : 'c' }));
            }

            if (!prot.fields.getByKey(resourceIdField)) {
                prot.fields.add(resourceIdField, new Ext.data.Field({ name : resourceIdField }));
            }

            if (!prot.fields.getByKey(nameField)) {
                prot.fields.add(nameField, new Ext.data.Field({ name : nameField }));
            }

            if (!prot.fields.getByKey(clsField)) {
                prot.fields.add(clsField, new Ext.data.Field({ name : clsField }));
            }

            if (!prot.fields.getByKey(idProperty)) {
                prot.fields.add(idProperty, new Ext.data.Field({ name : idProperty }));
            }

            onClassCreated.call(me, cls, data);
        };
    },

    /**
    * @cfg {String} resourceIdField The name of the field identifying the resource to which an event belongs. Defaults to "ResourceId".
    */ 
    resourceIdField : 'ResourceId',
    
    /**
    * @cfg {String} startDateField The name of the field that holds the event start date. Defaults to "StartDate".
    */ 
    startDateField  : 'StartDate',
    
    /**
    * @cfg {String} endDateField The name of the field that holds the event end date. Defaults to "EndDate".
    */
    endDateField    : 'EndDate',
    
    /**
    * @cfg {String} nameField The name of the field that holds the event name. Defaults to "EndDate".
    */
    nameField       : 'Name',

    /**
    * @cfg {String} clsField The name of the field that will be applied as a CSS class to each rendered event.
    */
    clsField       : 'Cls',

    // Overridden to be able to track previous record field values
    set : function(fieldName, value) {
        if (arguments.length === 2) {
            this.previous = this.previous || {};
            var currentValue = this.get(fieldName);
        
            // Store previous field value
            if (currentValue !== value) {
                this.previous[fieldName] = currentValue;
            }
        }
        this.callParent(arguments);
    },

    // Overridden to be able to track previous record field values
    afterEdit : function() {
        this.callParent(arguments);
        
        // Reset the previous tracking object
        delete this.previous;
    },

    // Overridden to be able to track previous record field values
    reject : function () {
        var me = this,
            modified = me.modified,
            field;

        me.previous = me.previous || {};
        for (field in modified) {
            if (modified.hasOwnProperty(field)) {
                if (typeof modified[field] != "function") {
                    me.previous[field] = me.get(field);
                }
            }
        }
        me.callParent(arguments);
        
        // Reset the previous tracking object
        delete me.previous;
    },

    /**
     * Returns the event start date
     * 
     * @return {Date} The start date 
     */
    getStartDate : function() {
        return this.get(this.startDateField);
    },

    /**
     * Returns the event end date
     * 
     * @return {Date} The end date 
     */
    getEndDate : function() {
        return this.get(this.endDateField);
    },

    /**
     * Sets the event start date
     * 
     * @param {Date} date The new start date 
     */
    setStartDate : function(date) {
        this.set(this.startDateField, date);
    },

    /**
     * Sets the event end date
     * 
     * @param {Date} date The new end date 
     */
    setEndDate : function(date) {
        this.set(this.endDateField, date);
    },

    /**
     * Returns either the resource associated with this event (when called w/o `resourceId`) or resource with specified id. 
     * 
     * @param {String} resourceId (optional)
     * @return {Sch.model.Resource} 
     */
    getResource : function(resourceId) {
        var rs = this.store.resourceStore;
        return rs[(rs instanceof Ext.data.TreeStore) ? "getNodeById" : "getById"](resourceId || this.get(this.resourceIdField));
    },

    /**
     * Sets the resource which the event should belong to.
     * 
     * @param {Sch.model.Resource/Mixed} resource The new resource
     */
    setResource : function(resourceOrId) {
        this.set(this.resourceIdField, (resourceOrId instanceof Sch.model.Resource) ? resourceOrId.get(resourceOrId.idProperty) : resourceOrId);
    },

    /**
     * Returns the resource id of the resource that the event belongs to.
     * @return {Mixed} The resource Id
     */
    getResourceId : function() {
        return this.get(this.resourceIdField);
    },

    /**
     * Sets the name of the event
     * 
     * @param {String} name The new name
     */
    setName : function(name) {
        this.set(this.nameField, name);
    },

    /**
     * Returns the name of the event
     * @return {String} The event name
     */
    getName : function() {
        return this.get(this.nameField);
    },

    /**
     * Returns the CSS class to add to the rendered event
     * @return {String} The CSS class
     */
    getCls : function() {
        return this.get(this.clsField);
    }
});
/**

@class Sch.model.Resource
@extends Ext.data.Model

This class represent a single Resource in the scheduler chart. Its a subclass of the {@link Ext.data.Model}.
Please refer to {@link Ext.data.Model} documentation to become familar with the base interface of the resource.

A Resource has only 2 mandatory fields - `Id` and `Name`. If you want to add more fields with meta data describing your resources then you should subclass this class:

    Ext.define('MyProject.model.Resource', {
        extend      : 'Sch.model.Resource',
        
        fields      : [
            // `Id` and `Name` fields are already provided by the superclass
            { name: 'Company',          type : 'string' }
        ],
        
        getCompany : function () {
            return this.get('Company');
        },
        ...
    });

If you want to use other names for the Id and Name fields you can configure them as seen below:

     Ext.define('MyProject.model.Resource', {
        extend      : 'Sch.model.Resource',
        nameField       : 'UserName',
        
        fields      : [
            { name: 'UserName', type : 'string' }
        ],
        ...
    });
*/
Ext.define('Sch.model.Resource', {
    extend      : 'Ext.data.Model',
    
    idProperty  : 'Id',

    /**
    * @cfg {String} nameField The name of the field that holds the resource name. Defaults to "Name".
    */
    nameField       : 'Name',

    fields : [
        'Id',
        'Name'
    ],
    // Here we add the default fields if client did not include fields for the properties:
    // Name (and the idProperty)
    onClassExtended: function(cls, data) {
        // HACK, is there a cleaner way to call parent class onClassExtended on Ext.data.Model?
        Ext.data.Model.prototype.$onExtended.apply(this, arguments);

        var me = this,
            onClassCreated = data.onClassCreated;

        data.onClassCreated = function(cls) {
            
            var prot = cls.prototype,
                sup = cls.superclass;

            // First clear the superclass fields
            sup.fields.eachKey(function(k) {
                if (!prot.fields.getByKey(k)) {
                    prot.fields.removeAtKey(k);
                }
            });

            var nameField = prot.nameField || sup.nameField;
            var idProperty = prot.idProperty || sup.idProperty;

            if (!prot.fields.getByKey(nameField)) {
                prot.fields.add(nameField, new Ext.data.Field({ name : nameField }));
            }

            if (!prot.fields.getByKey(idProperty)) {
                prot.fields.add(idProperty, new Ext.data.Field({ name : idProperty }));
            }

            onClassCreated.call(me, cls, data);
        };
    },

    getEventStore : function () {
        return this.store && this.store.eventStore || this.parentNode && this.parentNode.getEventStore();
    },

    
    /**
     * Returns an array of events, associated with this resource 
     * @return {Array[Sch.model.Event]}
     */
    getEvents : function() {
        var events = [], 
            ev,   
            id = this.get(this.idProperty),
            eventStore = this.getEventStore();

        for (var i = 0, l = eventStore.getCount(); i < l; i++) {
            ev = eventStore.getAt(i);
            if (ev.data[ev.resourceIdField] === id) {
                events.push(ev);
            }
        }

        return events;
    },
    
    /**
     * Returns the resource name
     * 
     * @return {String} The name of the resource
     */
    getName : function() {
        return this.get(this.nameField);
    },

    /**
     * Sets the resource name
     * 
     * @param {String} The new name of the resource
     */
    setName : function(name) {
        return this.set(this.nameField, name);
    }
});
/*
 * @class Sch.data.EventStoreAdaptions
 * @private
 * This is an 'inline override', i.e. some methods that will modify the event store "inline" to avoid having to create a special EventStore class.
 */
Ext.define("Sch.data.EventStoreAdaptions", {
    
    adaptEventStore : function() {
        // Not interested in datachanged event being fired upon inserting a record into the store
        // datachanged event is otherwise fired which resets the scroll each time an event is added.
        this.insert = this.modifiedInsert;
        this.remove = this.modifiedRemove;
    },

    // Prevent datachanged event from being fired by an eventStore add action
    modifiedInsert : function() {
        var O = Ext.util.Observable;
        O.capture(this, function(name) {
            return name !== 'datachanged';
        });
        this.self.prototype.insert.apply(this, arguments);
        O.releaseCapture(this);
    },

    // Prevent datachanged event from being fired by an eventStore remove action
    modifiedRemove : function() {
        var O = Ext.util.Observable;
        O.capture(this, function(name) {
            return name !== 'datachanged';
        });
        this.self.prototype.remove.apply(this, arguments);
        O.releaseCapture(this);
    }
});
/**
@class Sch.data.TimeAxis
@extends Ext.util.Observable

A class representing the time axis of the scheduler. The scheduler timescale is based on the ticks generated by this class.
This is a pure "data" (model) representation of the time axis and has no UI elements.
 
Time axis can be {@link #continuous} or not. In continuos time axis, each timespan start where the previous ended, in non-continuous - well, not.
Non-continuous time axis can be used when want to filter out certain days (like weekends) from the time axis.

To create a non-continuos time axis you have 2 options. First, you can create the time axis w/o unneeded timeframes from start.
To do that, subclass the time axis class and override the {@link #generateTicks} method. See the `noncontinuous-timeaxis` example.

Second, you can call the {@link #filterBy} method of the time axis, passing the function to it, which should return `true` if the time tick should be filtered out.
Calling the {@link #clearFilter} method will return you to full time axis.
 
*/
Ext.define("Sch.data.TimeAxis", {
    extend      : "Ext.util.Observable",
    
    requires    : [
        'Ext.data.JsonStore',
        'Sch.util.Date'
    ],
    
    
    reverse     : false,

    /**
    * @cfg {Boolean} continuous
    * Set to false if the timeline is not continuous, e.g. the next timespan does not start where the previous ended (for example skipping weekends etc).
    */
    continuous : true,

    autoAdjust : true,

    // private
    constructor : function(config) {
        Ext.apply(this, config);
        this.originalContinuous = this.continuous;

        this.addEvents(
            /**
            * @event reconfigure
            * Fires when the timeaxis has been reconfigured (e.g. new start/end date or unit/increment)
            * @param {Sch.data.TimeAxis} timeAxis The timeAxis object
            */
            'reconfigure'
        );
                
        this.tickStore = new Ext.data.JsonStore({
            // TODO Enable when needed for RTL support
//            sorters:{
//                property: 'start', 
//                direction: this.reverse ? "DESC" : "ASC"
//            },
            fields : [{ name : 'start', type : 'date' }, { name : 'end', type : 'date' }]
        });
        
        this.tickStore.on('datachanged', function() {
            this.fireEvent('reconfigure', this);
        }, this);
    },

    /**
    * Reconfigures the time axis based on the config object supplied and generates the new 'ticks'.
    * @param {Object} config
    * @private
    */
    reconfigure : function(config) {
        Ext.apply(this, config); 
        var tickStore = this.tickStore,
            ticks = this.generateTicks(this.start, this.end, this.unit, this.increment || 1, this.mainUnit);
        
        // Suspending to be able to detect an invalid filter
        tickStore.suspendEvents(true);
        tickStore.loadData(ticks);
        
        if (tickStore.getCount() === 0) {
            Ext.Error.raise('Invalid time axis configuration or filter, please check your input data.');
        }
        tickStore.resumeEvents();
    },

    /**
    * Changes the time axis timespan to the supplied start and end dates.
    * @param {Date} start The new start date
    * @param {Date} end The new end date
    */
    setTimeSpan : function(start, end) {
        this.reconfigure({
            start : start,
            end : end
        });
    },

    /**
     * [Experimental] Filter the time axis by a function. The passed function will be called with each tick in time axis. 
     * If the function returns true, the 'tick' is included otherwise it is filtered.
     * @param {Function} fn The function to be called, it will receive an object with start/end properties, and 'index' of the tick.
     * @param {Object} scope (optional) The scope (`this` reference) in which the function is executed. 
     */
    filterBy : function(fn, scope) {
        this.continuous = false;
        scope = scope || this;
        
        var tickStore = this.tickStore;

        tickStore.clearFilter(true);
        // Suspending to be able to detect an invalid filter
        tickStore.suspendEvents(true);
        tickStore.filter([{
            filterFn : function(t, index) {
                return fn.call(scope, t.data, index);
            }
        }]);
        
        if (tickStore.getCount() === 0) {
            Ext.Error.raise('Invalid time axis filter - no columns passed through the filter. Please check your filter method.');
            this.clearFilter();
        }
        tickStore.resumeEvents();
    },

    /**
     * Returns `true` if the time axis is continuos (will return `false` when filtered)
     * @return {Boolean}
     */
    isContinuous : function() {
        return this.continuous && !this.tickStore.isFiltered();
    },

    /**
     * Clear the current filter of the time axis
     */
    clearFilter : function() {
        this.continuous = this.originalContinuous;
        this.tickStore.clearFilter();
    },

    /**
     * Method generating the ticks for this time axis. Should return an array of ticks. Each tick is an object of the following structure:
        {
            start       : ..., // start date
            end         : ...  // end date
        }
     *  
     * @param {Date} startDate The start date of the interval
     * @param {Date} endDate The end date of the interval
     * @param {String} unit The unit of the time axis
     * @param {Mixed} increment The increment for the unit specified.
     * @return {Array} ticks The ticks representing the time axis
     */
    generateTicks : function(start, end, unit, increment) {
    
        var ticks = [],
            intervalEnd;

        unit = unit || this.unit;
        increment = increment || this.increment;
        
        if (this.autoAdjust) {
            start = this.floorDate(start || this.getStart(), false);
            end = this.ceilDate(end || Sch.util.Date.add(start, this.mainUnit, this.defaultSpan), false);
        }
       
        while (start < end) {
            intervalEnd = this.getNext(start, unit, increment);
            
            ticks.push({
                start : start,
                end : intervalEnd
            });
            start = intervalEnd;
        }
        return ticks;
    },

    /**
    * Gets a tick coordinate representing the date parameter on the time scale
    * @param {Date} date the date to get x coordinate for
    * @return {Float} the tick position on the scale
    */
    getTickFromDate : function(date) {
        
        if (this.getStart() > date || this.getEnd() < date) {
            return -1;
        } 

        var ticks = this.tickStore.getRange(),
            tickStart, tickEnd, i, l;

        if (this.reverse) {
            for (i = ticks.length-1; i >= 0; i--) {
                tickEnd = ticks[i].data.end;
                if (date <= tickEnd) {
                    tickStart = ticks[i].data.start;
                    
                    return i + (date < tickEnd ? (1 - (date - tickStart)/(tickEnd - tickStart)) : 0);
                } 
            }
        } else {
            for (i = 0, l = ticks.length; i < l; i++) {
                tickEnd = ticks[i].data.end;
                if (date <= tickEnd) {
                    tickStart = ticks[i].data.start;
                    
                    return i + (date > tickStart ? (date - tickStart)/(tickEnd - tickStart) : 0);
                } 
            }
        }
        
        return -1;
    },

    /**
    * Gets the time represented by a tick "coordinate".
    * @param {Float} tick the tick "coordinate"
    * @param {String} roundingMethod The rounding method to use
    * @return {Date} The date to represented by the tick "coordinate", or null if invalid.
    */
    getDateFromTick : function(tick, roundingMethod) {
        var count = this.tickStore.getCount();
        
        if (tick === count){
            return this.reverse ? this.getStart() : this.getEnd();
        }

        var wholeTick = Math.floor(tick),
            fraction = tick - wholeTick,
            t = this.getAt(wholeTick);

        var date = Sch.util.Date.add(t.start, Sch.util.Date.MILLI, (this.reverse ? (1 - fraction) : fraction) * (t.end - t.start));

        if (roundingMethod) {
            date = this[roundingMethod + 'Date'](date);
        }

        return date;
    },

    /**
    * Gets the tick with start and end date for the indicated tick index
    * @param {Float} tick the tick "coordinate"
    * @return {Object} The tick object containing a "start" date and an "end" date.
    */
    getAt : function(index) {
        return this.tickStore.getAt(index).data;
    },

    // private
    getCount : function() {
        return this.tickStore.getCount();
    },
    
    // private
    getTicks : function() {
        var ticks = [];
        
        this.tickStore.each(function(r) { ticks.push(r.data); });
        return ticks;
    },

    /**
    * Method to get the current start date of the time axis
    * @return {Date} The start date
    */
    getStart : function() {
        return Ext.Date.clone(this.tickStore[this.reverse ? "last" : "first"]().data.start);
    },

    /**
    * Method to get a the current end date of the time axis
    * @return {Date} The end date
    */
    getEnd : function() {
        return Ext.Date.clone(this.tickStore[this.reverse ? "first" : "last"]().data.end);
    },

    // Floors the date to nearest minute increment
    // private
    roundDate : function(date) {
        var dt = Ext.Date.clone(date),
            relativeTo = this.getStart(),
            increment = this.resolutionIncrement;
        
        switch(this.resolutionUnit) {
            case Sch.util.Date.MILLI:    
                var milliseconds = Sch.util.Date.getDurationInMilliseconds(relativeTo, dt),
                    snappedMilliseconds = Math.round(milliseconds / increment) * increment;
                dt = Sch.util.Date.add(relativeTo, Sch.util.Date.MILLI, snappedMilliseconds);
                break;

            case Sch.util.Date.SECOND:
                var seconds = Sch.util.Date.getDurationInSeconds(relativeTo, dt),
                    snappedSeconds = Math.round(seconds / increment) * increment;
                dt = Sch.util.Date.add(relativeTo, Sch.util.Date.MILLI, snappedSeconds * 1000);
                break;

            case Sch.util.Date.MINUTE:
                var minutes = Sch.util.Date.getDurationInMinutes(relativeTo, dt),
                    snappedMinutes = Math.round(minutes / increment) * increment;
                dt = Sch.util.Date.add(relativeTo, Sch.util.Date.SECOND, snappedMinutes * 60);
                break; 

            case Sch.util.Date.HOUR:
                var nbrHours = Sch.util.Date.getDurationInHours(this.getStart(), dt),
                    snappedHours = Math.round(nbrHours / increment) * increment;
                dt = Sch.util.Date.add(relativeTo, Sch.util.Date.MINUTE, snappedHours * 60);
                break;

            case Sch.util.Date.DAY:
                var nbrDays = Sch.util.Date.getDurationInDays(relativeTo, dt),
                    snappedDays = Math.round(nbrDays / increment) * increment;
                dt = Sch.util.Date.add(relativeTo, Sch.util.Date.DAY, snappedDays);
                break;

            case Sch.util.Date.WEEK:
                Ext.Date.clearTime(dt);

                var distanceToWeekStartDay = dt.getDay() - this.weekStartDay,
                    toAdd;
                    
                if (distanceToWeekStartDay < 0) {
                    distanceToWeekStartDay = 7 + distanceToWeekStartDay;
                }

                if (Math.round(distanceToWeekStartDay/7) === 1) {
                    toAdd = 7 - distanceToWeekStartDay;
                } else {
                    toAdd = -distanceToWeekStartDay;
                }

                dt = Sch.util.Date.add(dt, Sch.util.Date.DAY, toAdd);
                break;

            case Sch.util.Date.MONTH:
                var nbrMonths = Sch.util.Date.getDurationInMonths(relativeTo, dt) + (dt.getDate() / Ext.Date.getDaysInMonth(dt)),
                    snappedMonths = Math.round(nbrMonths / increment) * increment;
                dt = Sch.util.Date.add(relativeTo, Sch.util.Date.MONTH, snappedMonths);
                break;

            case Sch.util.Date.QUARTER:
                Ext.Date.clearTime(dt);
                dt.setDate(1);
                dt = Sch.util.Date.add(dt, Sch.util.Date.MONTH, 3 - (dt.getMonth() % 3));
                break;

            case Sch.util.Date.YEAR:
                var nbrYears = Sch.util.Date.getDurationInYears(relativeTo, dt),
                    snappedYears = Math.round(nbrYears / increment) * increment;
                dt = Sch.util.Date.add(relativeTo, Sch.util.Date.YEAR, snappedYears);
                break;

        }
        return dt;
    },
    
    // Floors a date to the current resolution
    // private
    floorDate : function(date, relativeToStart) {
        relativeToStart = relativeToStart !== false;
        
        var dt = Ext.Date.clone(date),
            relativeTo = relativeToStart ? this.getStart() : null,
            increment = this.resolutionIncrement;
            
        switch(relativeToStart ? this.resolutionUnit : this.mainUnit) {
            case Sch.util.Date.MILLI:    
                if (relativeToStart) {
                    var milliseconds = Sch.util.Date.getDurationInMilliseconds(relativeTo, dt),
                        snappedMilliseconds = Math.floor(milliseconds / increment) * increment;
                    dt = Sch.util.Date.add(relativeTo, Sch.util.Date.MILLI, snappedMilliseconds);
                }
                break;

            case Sch.util.Date.SECOND:
                if (relativeToStart) {
                    var seconds = Sch.util.Date.getDurationInSeconds(relativeTo, dt),
                        snappedSeconds = Math.floor(seconds / increment) * increment;
                    dt = Sch.util.Date.add(relativeTo, Sch.util.Date.MILLI, snappedSeconds * 1000);
                } else {
                    dt.setMilliseconds(0);
                }
                break;

            case Sch.util.Date.MINUTE:
                if (relativeToStart) {
                    var minutes = Sch.util.Date.getDurationInMinutes(relativeTo, dt),
                        snappedMinutes = Math.floor(minutes / increment) * increment;
                    dt = Sch.util.Date.add(relativeTo, Sch.util.Date.SECOND, snappedMinutes * 60);
                } else {
                    dt.setSeconds(0);
                    dt.setMilliseconds(0);
                }
                break; 

            case Sch.util.Date.HOUR:
                if (relativeToStart) {
                    var nbrHours = Sch.util.Date.getDurationInHours(this.getStart(), dt),
                        snappedHours = Math.floor(nbrHours / increment) * increment;
                    dt = Sch.util.Date.add(relativeTo, Sch.util.Date.MINUTE, snappedHours * 60);
                } else {
                    dt.setMinutes(0);
                    dt.setSeconds(0);
                    dt.setMilliseconds(0);
                }
                break;

            case Sch.util.Date.DAY:
                if (relativeToStart) {
                    var nbrDays = Sch.util.Date.getDurationInDays(relativeTo, dt),
                        snappedDays = Math.floor(nbrDays / increment) * increment;
                    dt = Sch.util.Date.add(relativeTo, Sch.util.Date.DAY, snappedDays);
                } else {
                    Ext.Date.clearTime(dt);
                }
                break;

            case Sch.util.Date.WEEK:
                var day = dt.getDay();
                Ext.Date.clearTime(dt);
                if (day !== this.weekStartDay) {
                    dt = Sch.util.Date.add(dt, Sch.util.Date.DAY, -(day > this.weekStartDay ? (day - this.weekStartDay) : (7 - day - this.weekStartDay)));
                }
                break;

            case Sch.util.Date.MONTH:
                if (relativeToStart) {
                    var nbrMonths = Sch.util.Date.getDurationInMonths(relativeTo, dt),
                        snappedMonths = Math.floor(nbrMonths / increment) * increment;
                    dt = Sch.util.Date.add(relativeTo, Sch.util.Date.MONTH, snappedMonths);
                } else {
                    Ext.Date.clearTime(dt);
                    dt.setDate(1);
                }
                break;

            case Sch.util.Date.QUARTER:
                Ext.Date.clearTime(dt);
                dt.setDate(1);
                dt = Sch.util.Date.add(dt, Sch.util.Date.MONTH, -(dt.getMonth() % 3));
                break;

            case Sch.util.Date.YEAR:
                if (relativeToStart) {
                    var nbrYears = Sch.util.Date.getDurationInYears(relativeTo, dt),
                        snappedYears = Math.floor(nbrYears / increment) * increment;
                    dt = Sch.util.Date.add(relativeTo, Sch.util.Date.YEAR, snappedYears);
                } else {
                    dt = new Date(date.getFullYear(), 0, 1);
                }
                break;

        }
        return dt;
    },

    // private
    ceilDate : function(date, relativeToStart) {
        var dt = Ext.Date.clone(date);
        relativeToStart = relativeToStart !== false;
        
        var increment = relativeToStart ? this.resolutionIncrement : 1,
            unit = relativeToStart ? this.resolutionUnit : this.mainUnit,
            doCall = false;

        switch (unit) {
            case Sch.util.Date.DAY: 
                if (dt.getMinutes() > 0 || dt.getSeconds() > 0 || dt.getMilliseconds() > 0) {
                    doCall = true;
                }
            break;

            case Sch.util.Date.WEEK: 
                Ext.Date.clearTime(dt);
                if (dt.getDay() !== this.weekStartDay) {
                    doCall = true;
                }
            break;

            case Sch.util.Date.MONTH: 
                Ext.Date.clearTime(dt);
                if(dt.getDate() !== 1) {
                    doCall = true;
                }
            break;

            case Sch.util.Date.QUARTER:
                Ext.Date.clearTime(dt);
                if(dt.getMonth() % 3 !== 0) {
                    doCall = true;
                }
            break;
            
            case Sch.util.Date.YEAR:
                Ext.Date.clearTime(dt);
                if(dt.getMonth() !== 0 && dt.getDate() !== 1) {
                    doCall = true;
                }
            break;

            default:
            break;
        }

        if (doCall) {
            return this.getNext(dt, unit, increment);
        } else {
            return dt;
        }
    },

    // private
    getNext : function(date, unit, increment) {
        return Sch.util.Date.getNext(date, unit, increment, this.weekStartDay);
    },

    // private
    getResolution : function() {
        return {
            unit : this.resolutionUnit,
            increment : this.resolutionIncrement
        };
    },

    // private
    setResolution : function(unit, increment) {
        this.resolutionUnit = unit;
        this.resolutionIncrement = increment || 1;
    },

    /**
    * Moves the time axis forward in time in units specified by the view preset `shiftUnit`, and by the amount specified by the `shiftIncrement` 
    * config of the current view preset.
    * @param {Int} amount (optional) The number of units to jump forward
    */
    shiftNext: function (amount) {
        amount = amount || this.getShiftIncrement();
        var unit = this.getShiftUnit();
        this.setTimeSpan(Sch.util.Date.add(this.getStart(), unit, amount), Sch.util.Date.add(this.getEnd(), unit, amount));
    },

    /**
    * Moves the time axis backward in time in units specified by the view preset `shiftUnit`, and by the amount specified by the `shiftIncrement` config of the current view preset.
    * @param {Int} amount (optional) The number of units to jump backward
    */
    shiftPrevious: function (amount) {
        amount = -(amount || this.getShiftIncrement());
        var unit = this.getShiftUnit();
        this.setTimeSpan(Sch.util.Date.add(this.getStart(), unit, amount), Sch.util.Date.add(this.getEnd(), unit, amount));
    },

    getShiftUnit: function () {
        return this.shiftUnit || this.getMainUnit();
    },
    
    // private
    getShiftIncrement: function () {
        return this.shiftIncrement || 1;
    },
    
    // private
    getUnit: function () {
        return this.unit;
    },

    // private
    getIncrement: function () {
        return this.increment;
    },

    /**
    * Returns true if the passed timespan is part of the current time axis (in whole or partially).
    * @param {Date} start The start date
    * @param {Date} end The end date
    * @return {boolean} true if the timespan is part of the timeaxis
    */
    timeSpanInAxis: function(start, end) {
        if (this.continuous) {
            return Sch.util.Date.intersectSpans(start, end, this.getStart(), this.getEnd());
        } else {
            return end > start && this.getTickFromDate(start) !== this.getTickFromDate(end);
        }
    }
});
/**
@class Sch.view.Horizontal

A mixin, purposed to be consumed along with {@link Sch.mixin.TimelineView} and providing the implementation of some methods, specific to horizontal orientation.

*/
Ext.define("Sch.view.Horizontal", {
    props : {
        
        translateToScheduleCoordinate: function (x) {
            return x - this.el.getX() + this.el.getScroll().left;
        },

        translateToPageCoordinate: function (x) {
            return x + this.el.getX() - this.el.getScroll().left;
        },

        /**
        * Gets the date for an XY coordinate
        * @param {Array} xy The page X and Y coordinates
        * @param {String} roundingMethod The rounding method to use
        * @returns {Date} the Date corresponding to the xy coordinate
        * @abstract
        */
        getDateFromXY: function (xy, roundingMethod) {
            var date,
                x = this.translateToScheduleCoordinate(xy[0]),
                tick = x / this.getActualTimeColumnWidth(),
                maxCol = this.headerCt.getColumnCount();
                
            if (tick < 0 || tick > maxCol) {
                date = null;
            } else {
                var diff = tick - this.resolveColumnIndex(x);
                if (diff > 2 && tick >= maxCol) {
                    return null;
                }
                date = this.timeAxis.getDateFromTick(tick, roundingMethod);
            }
            return date;
        },

        /**
        *  Gets xy coordinates relative to the element containing the time columns time for a date
        *  @param {Date} xy, the page X and Y coordinates
        *  @param {Boolean} local, true to return a coordinate local to the element containing the calendar columns
        *  @returns {Array} the XY coordinates representing the date
        */
        getXYFromDate: function (date, local) {
            var x,
                tick = this.timeAxis.getTickFromDate(date);
            
            if (tick >= 0) {
                x = this.getActualTimeColumnWidth() * tick;
            }

            if (local === false){
                x = this.translateToPageCoordinate(x);
            }

            return [x, 0];
        },

        getEventBox : function(start, end) {
            var startX = Math.floor(this.getXYFromDate(start)[0]),
                endX = Math.floor(this.getXYFromDate(end)[0]),
                M = Math;
            
            if (this.managedEventSizing) {
                return {
                    top : this.barMargin - this.eventBorderWidth - this.cellBorderWidth,
                    left : M.min(startX, endX),
                    width : M.max(1, M.abs(startX - endX)),
                    height : this.rowHeight - (2 * this.barMargin) - this.eventBorderWidth
                };
            }
            return {
                left : M.min(startX, endX),
                width : M.max(1, M.abs(startX - endX))
            };
        },

        layoutEvents: function (events) {

            var rowEvents = Ext.Array.clone(events);

            // Sort events by start date, and text properties.
            rowEvents.sort(this.sortEvents);

            var nbrBandsRequired = this.layoutEventsInBands(0, rowEvents);

            return nbrBandsRequired;
        },

        layoutEventsInBands: function (bandIndex, events) {
            var ev = events[0],
                bandTop = bandIndex === 0 ? this.barMargin : (bandIndex * this.rowHeight - ((bandIndex - 1) * this.barMargin));
            
            bandTop -= this.cellBorderWidth;
            while (ev) {
                // Apply band height to the event cfg
                ev.top = bandTop;

                // Remove it from the array and continue searching
                Ext.Array.remove(events, ev);
                ev = this.findClosestSuccessor(ev, events);
            }

            bandIndex++;

            if (events.length > 0) {
                return this.layoutEventsInBands(bandIndex, events);
            } else {
                // Done!
                return bandIndex;
            }
        },

         /**
        * Gets the Ext.util.Region represented by the schedule and optionally only for a single resource. This method will call getDateConstraints to 
        * allow for additional resource/event based constraints. By overriding that method you can constrain events differently for
        * different resources.
        * @param {Ext.data.Model} resourceRecord (optional) The resource record 
        * @param {Ext.data.Model} eventRecord (optional) The event record 
        * @return {Ext.util.Region} The region of the schedule
        */
        getScheduleRegion: function (resourceRecord, eventRecord) {
            var region      = resourceRecord ? Ext.fly(this.getNodeByRecord(resourceRecord)).getRegion() : this.el.down('.x-grid-table').getRegion(),
            
                taStart     = this.timeAxis.getStart(),
                taEnd       = this.timeAxis.getEnd(),
                
                dateConstraints     = this.getDateConstraints(resourceRecord, eventRecord) || { start: taStart, end: taEnd },
                
                startX              = this.translateToPageCoordinate(this.getXYFromDate(dateConstraints.start)[0]),
                endX                = this.translateToPageCoordinate(this.getXYFromDate(dateConstraints.end)[0]), // - this.eventBorderWidth, // TODO cleanup, this prevents the events to be dragged to the right edge of the scheduler
                
                top         = region.top + this.barMargin,
                bottom      = (resourceRecord ? (top + this.rowHeight - this.barMargin) : region.bottom) - this.barMargin;// - this.eventBorderWidth;

            return new Ext.util.Region(top, Math.max(startX, endX), bottom, Math.min(startX, endX));
        },

        collectRowData : function(rowData, resourceRecord, index){
            if (this.headerCt.getColumnCount() === 0) {
                return rowData;
            }
            
            var D = Sch.util.Date,
                ta = this.timeAxis,
                viewStart = ta.getStart(),
                viewEnd = ta.getEnd(),
                resourceEvents = resourceRecord.getEvents(),
                eventsToRender = [],
                i, l;
            
            // Iterate events belonging to current row
            for (i = 0, l = resourceEvents.length; i < l; i++) {
                var event = resourceEvents[i],
                    start = event.getStartDate(),
                    end = event.getEndDate();
                
                // Determine if the event should be rendered or not
                if (start && end && ta.timeSpanInAxis(start, end)) {
                    var tplData = this.generateTplData(event, viewStart, viewEnd, resourceRecord, index);
                    eventsToRender[eventsToRender.length] = tplData;
                }
            }

            var nbrOfBandsRequired = 1;

            // Event data is now gathered, calculate layout properties for each event (if dynamicRowHeight is used)
            if (this.dynamicRowHeight) {
                nbrOfBandsRequired = this.layoutEvents(eventsToRender);
            }

            // Set rowHeight property that is applied by Scheduling feature
            rowData.rowHeight = (nbrOfBandsRequired * this.rowHeight) - ((nbrOfBandsRequired - 1) * this.barMargin);
            
            // Inject the rendered events into the first cell for the row
            rowData[this.getFirstTimeColumn().id] += '&#160;' + this.eventTpl.apply(eventsToRender);
        
            return rowData;
        },
    
        // private
        resolveResource: function (t) {
            var node = this.findItemByChild(t);
            if (node) {
                return this.getRecord(this.findItemByChild(t));
            } 

            return null;
        },

        /**
        *  Returns the region for a "global" time span in the view. Coordinates are relative to element containing the time columns
        *  @param {Date} startDate The start date of the span
        *  @param {Date} endDate The end date of the span
        *  @return {Ext.util.Region} The region for the time span
        */
        getTimeSpanRegion: function (startDate, endDate) {
            var startX = this.getXYFromDate(startDate)[0],
                endX = this.getXYFromDate(endDate || startDate)[0],
                tableEl = this.el.down('.x-grid-table'),
                height = (tableEl || this.el).dom.clientHeight; // fallback in case grid is not rendered (no rows/table)

            return new Ext.util.Region(0, Math.max(startX, endX), height, Math.min(startX, endX));
        },

        /**
        * Gets the start and end dates for an element Region
        * @param {Region} region The region to map to start and end dates
        * @param {String} roundingMethod The rounding method to use
        * @returns {Object} an object containing start/end properties
        */
        getStartEndDatesFromRegion: function (region, roundingMethod) {
            var leftDate = this.getDateFromXY([region.left, region.top], roundingMethod),
                rightDate = this.getDateFromXY([region.right, region.bottom], roundingMethod);
        
            if (rightDate && leftDate) {
                return {
                    start : Sch.util.Date.min(leftDate, rightDate),
                    end : Sch.util.Date.max(leftDate, rightDate)
                };
            } else {
                return null;
            }
        },

        // private
        onEventAdd: function (s, recs) {
            var resource;
            for (var i = 0, l = recs.length; i < l; i++) {
                resource = recs[i].getResource();
                if (resource) {
                    this.onUpdate(resource.store, resource);
                }
            }
        },

        // private
        onEventRemove: function (s, eventRecord) {
            var el = this.getElementFromEventRecord(eventRecord);

            if (el) {
                var resource = this.resolveResource(el);
                el.fadeOut({
                    callback: function () {
                        if (this.resourceStore.indexOf(resource) >= 0) {
                            this.onUpdate(this.resourceStore, resource);
                        }
                    },
                    scope: this
                });
            }
        },

        // private
        onEventUpdate: function (store, model, operation) {
            var resource,
                previous = model.previous;
          
            if (previous && previous[model.resourceIdField]) {
                // If an event has been moved to a new row, refresh old row first
                resource = model.getResource(previous[model.resourceIdField]);
                if (resource) {
                    this.onUpdate(this.resourceStore, resource);
                }
            }

            resource = model.getResource();
            if (resource) {
                this.onUpdate(this.resourceStore, resource);
            }
        },

        /**
        * Returns the amount of pixels for a single unit
        * @private
        * @return {String} The unit in pixel
        */
        getSingleTickInPixels: function () {
            return this.getActualTimeColumnWidth();
        },

        setColumnWidth : function (width, preventRefresh) {
            if (this.getTimeAxisColumn()) {
                this.getTimeAxisColumn().setTimeColumnWidth(width);
                this.columnWidth = width;

                if (!preventRefresh) {
                    this.refresh();
                }
            }
            
            this.fireEvent('columnwidthchange', this, width);
        }
    }
}); 

/**
@class Sch.view.Vertical

A mixin, purposed to be consumed along with {@link Sch.mixin.TimelineView} and providing the implementation of some methods, specific to vertical orientation.

*/
Ext.define("Sch.view.Vertical", {
    props : {
        
        translateToScheduleCoordinate: function (y) {
            return y - this.el.getY() + this.el.getScroll().top;
        },

        // private
        translateToPageCoordinate: function (y) {
            var el = this.el,
                scroll = el.getScroll();

            return y + el.getY() - scroll.top;
        },

        /**
        * Gets the date for an XY coordinate
        * @param {Array} xy The page X and Y coordinates
        * @param {String} roundingMethod The rounding method to use
        * @returns {Date} the Date corresponding to the xy coordinate
        * @abstract
        */
        getDateFromXY: function (xy, roundingMethod) {
            var date,
                y = this.translateToScheduleCoordinate(xy[1]);

            var tick = y / this.rowHeight, 
                max = this.timeAxis.getCount();

            if (tick < 0 || tick > max) {
                date = null;
            } else {
                date = this.timeAxis.getDateFromTick(tick, roundingMethod);
            }
            return date;
        },

        /**
        *  Gets xy coordinates relative to the element containing the time columns time for a date
        *  @param {Date} xy, the page X and Y coordinates
        *  @param {Boolean} local, true to return a coordinate local to the element containing the calendar columns
        *  @returns {Array} the XY coordinates representing the date
        */
        getXYFromDate: function (date, local) {
            var y = -1,
                tick = this.timeAxis.getTickFromDate(date);
            
            if (tick >= 0) {
                y = this.rowHeight * tick; 
            }

            if (local === false){
                y = this.translateToPageCoordinate(y);
            }

            return [0, y];
        },

        getEventBox : function(start, end) {
            var startY = Math.floor(this.getXYFromDate(start)[1]),
                endY = Math.floor(this.getXYFromDate(end)[1]),
                M = Math;
            
            if (this.managedEventSizing) { 
                return {
                    left : this.barMargin,
                    width : this.panel.resourceColumnWidth - (2*this.barMargin) - this.eventBorderWidth,
                    top : M.max(0, M.min(startY, endY) - this.eventBorderWidth),
                    height : M.max(1, M.abs(startY - endY))
                };
            }
            return {
                top : M.min(startY, endY),
                height : M.max(1, M.abs(startY - endY))
            };
        },

        getScheduleRegion: function (resourceRecord, eventRecord) {
            var region      = resourceRecord ? Ext.fly(this.getCellByPosition({ column : this.resourceStore.indexOf(resourceRecord), row : 0})).getRegion() : this.el.down('.x-grid-table').getRegion(),
            
                taStart     = this.timeAxis.getStart(),
                taEnd       = this.timeAxis.getEnd(),
                
                dateConstraints     = this.getDateConstraints(resourceRecord, eventRecord) || { start: taStart, end: taEnd },
                
                startY      = this.translateToPageCoordinate(this.getXYFromDate(Sch.util.Date.min(taStart, dateConstraints.start))[1]),
                endY        = this.translateToPageCoordinate(this.getXYFromDate(Sch.util.Date.max(taEnd, dateConstraints.end))[1]), // - this.eventBorderWidth,
                
                left        = region.left + this.barMargin,
                right       = (resourceRecord ? (region.left + this.panel.resourceColumnWidth) : region.right) - this.barMargin;// - this.eventBorderWidth;

            return new Ext.util.Region(Math.min(startY, endY), right, Math.max(startY, endY), left);
        },

        // Try to pack the events to consume as little space as possible
        layoutEvents: function (events) {

            if (events.length === 0) {
                return;
            }

            // Sort events by start date, and text properties.
            events.sort(this.sortEvents);

            var start, end, 
                D = Sch.util.Date,
                band = 1,
                startFraction,
                slot,
                totalAvailableWidth = this.panel.resourceColumnWidth - (2*this.barMargin),
                firstInCluster,
                j;
            
            for (var i = 0, l = events.length; i < l; i++) {
                firstInCluster = events[i];
                start = firstInCluster.start;
                end = firstInCluster.end;
                
                slot = this.findStartSlot(events, firstInCluster);
                
                var cluster = this.getCluster(events, i);
                    
                if (cluster.length > 1) {
                    firstInCluster.left = slot.start;
                    firstInCluster.width = slot.end - slot.start;
                    
                    // If there are multiple slots and events in the cluster have multiple start dates, group all same-start events into first slot
                    j = 1;
                    
                    while(j < (cluster.length-1) && cluster[j+1].start - firstInCluster.start === 0) {
                        j++;
                    }
                    
                    // See if there's more than 1 slot available for this cluster, if so - first group in cluster consumes the entire first slot
                    var nextSlot = this.findStartSlot(events, cluster[j]);
                    if (nextSlot && nextSlot.start < 0.8) {
                        cluster = cluster.slice(0, j);
                    }
                }

                var count = cluster.length,
                    barWidth = (slot.end-slot.start)/count;
                
                // Apply fraction values
                for (j = 0; j < count; j++) {
                    cluster[j].width = barWidth;
                    cluster[j].left = slot.start + (j*barWidth);
                }
            
                i += count - 1;
            }
        
            for (i = 0, l = events.length; i < l; i++) {
                events[i].width = events[i].width*totalAvailableWidth;
                events[i].left = this.barMargin + (events[i].left*totalAvailableWidth);
            }
        },

        findStartSlot : function(events, event) {
            var D = Sch.util.Date,
                start = event.start,
                end = event.end,
                slotStart = 0,
                slotEnd,
                overlapMax = 0,
                j,
                rightEdge,
                eventIndex = Ext.Array.indexOf(events, event),
                priorOverlappers = this.getPriorOverlappingEvents(events, event),
                i;
            
            if (priorOverlappers.length === 0) {
                return {
                    start : 0,
                    end : 1
                };
            }

            for (i = 0; i < priorOverlappers.length ; i++) {
                if (i === 0 && priorOverlappers[0].left > 0) {
                    return {
                        start : 0,
                        end : priorOverlappers[0].left
                    };
                } else if (priorOverlappers[i].left + priorOverlappers[i].width < (i < priorOverlappers.length - 1 ? priorOverlappers[i+1].left : 1)) {
                    return {
                        start : priorOverlappers[i].left + priorOverlappers[i].width,
                        end : i < priorOverlappers.length - 1 ? priorOverlappers[i+1].left : 1
                    };
                }
            }

            return false;
        },

        getPriorOverlappingEvents : function(events, event) {
            var D = Sch.util.Date,
                start = event.start,
                end = event.end,
                overlappers = [];

            for (var i = 0, l = Ext.Array.indexOf(events, event); i < l ; i++) {
                if (D.intersectSpans(start, end, events[i].start, events[i].end)) {
                    overlappers.push(events[i]);
                } 
            }
            
            overlappers.sort(function(e1, e2) {
                return e1.left < e2.left ? -1 : 1;
            });
            return overlappers;
        },

        getCluster : function(events, startIndex) {
            if (startIndex >= events.length-1) return [events[startIndex]];

            var evts = [events[startIndex]],
                l = events.length,
                start = events[startIndex].start,
                end = events[startIndex].end,
                D = Sch.util.Date,
                i = startIndex+1;

            while(i < l && D.intersectSpans(start, end, events[i].start, events[i].end)) {
                evts.push(events[i]);
                start = D.max(start, events[i].start);
                end = D.min(events[i].end, end);
                i++;
            }

            return evts;
        },

        collectRowData : function(rowData, record, rowIndex){
        
            if (rowIndex === 0) {
                var D = Sch.util.Date,
                    ta = this.timeAxis,
                    viewStart = ta.getStart(),
                    viewEnd = ta.getEnd(),
                    rowEvents = [],
                    colCount = this.headerCt.getColumnCount(),
                    resourceRecord,
                    columnEvents,
                    resourceEvents,
                    header, i, l;

                // Render events in the first cell of top row
                for (var colIndex = 0; colIndex < colCount; colIndex++) {
                    header = this.getHeaderAtIndex(colIndex);
                    columnEvents = [];
                    resourceRecord = this.resourceStore.getAt(colIndex);
                    resourceEvents = resourceRecord.getEvents();
                
                    // Iterate events (belonging to current resource) 
                    for (i = 0, l = resourceEvents.length; i < l; i++) {
                        var event = resourceEvents[i],
                            start = event.getStartDate(),
                            end = event.getEndDate();

                        // Determine if the event should be rendered or not
                        if (start && end && ta.timeSpanInAxis(start, end)) {
                            columnEvents.push(this.generateTplData(event, viewStart, viewEnd, resourceRecord, colIndex));
                        }
                    }
                    this.layoutEvents(columnEvents);
                    rowData[header.id] += '&#160;' + this.eventTpl.apply(columnEvents);
                }
            }
            rowData.rowHeight = this.rowHeight;
            return rowData;
        },

        // private
        resolveResource: function (cell) {
            var hd = this.getHeaderByCell(cell);
            if (hd) {
                return this.resourceStore.getAt(this.headerCt.getHeaderIndex(hd));
            } 

            return null;
        },

        // private
        onEventUpdate: function (store, model) {
            this.renderSingle(model);
            var previous = model.previous;
            
            if (previous && previous[model.resourceIdField]) {
                // If an event has been moved to a new resource, refresh old resource first
                resource = model.getResource(previous[model.resourceIdField]);
                this.relayoutRenderedEvents(resource);
            }

            this.relayoutRenderedEvents(model.getResource());
        },

        // private
        onEventAdd: function (s, recs) {
            if (recs.length === 1) {
                this.renderSingle(recs[0]);
                this.relayoutRenderedEvents(recs[0].getResource());
            } else {
                this.onUpdate(this.store, this.store.first());
            }
        },

        // private
        onEventRemove: function (s, recs) {
            if (recs.length === 1) {
                this.relayoutRenderedEvents(this.getResourceByEventRecord(recs[0]));
            } else {
                this.onUpdate(this.store, this.store.first());
            }
        },

        relayoutRenderedEvents : function(resource) {
            var data = [],
                i, l, event, node,
                events = resource.getEvents();
                
            if (events.length > 0) {

                for (i = 0, l = events.length; i < l; i++) {
                    event = events[i];
                    node = this.getEventNodeByRecord(event);

                    if (node) {
                        data.push({
                            start : event.getStartDate(),
                            end : event.getEndDate(),
                            id : node.id
                        });
                    }
                }

                this.layoutEvents(data);

                for (i = 0; i < data.length; i++) {
                    event = data[i];
                    Ext.fly(event.id).setStyle({
                        left : event.left + 'px',
                        width : event.width + 'px'
                    });
                }
            }
        },

        renderSingle : function (event) {
            // Inject moved event into correct cell
            var resource        = event.getResource();
            var existing        = this.getEventNodeByRecord(event);
            var rIndex          = resource.store.indexOf(resource);

            if (existing) {
                Ext.fly(existing).remove();
            }

            var containerCell   = this.getCell(this.store.getAt(0), this.headerCt.getHeaderAtIndex(rIndex)).first();
            var data            = this.generateTplData(event, this.timeAxis.getStart(), this.timeAxis.getEnd(), resource, rIndex);

            this.eventTpl.append(containerCell, [data]);
        },

        /**
        *  Returns the region for a "global" time span in the view. Coordinates are relative to element containing the time columns
        *  @param {Date} startDate The start date of the span
        *  @param {Date} endDate The end date of the span
        *  @return {Ext.util.Region} The region for the time span
        */
        getTimeSpanRegion: function (startDate, endDate) {
            var startY = this.getXYFromDate(startDate)[1],
                endY = this.getXYFromDate(endDate || startDate)[1],
                tableEl = this.el.down('.x-grid-table'),
                width = (tableEl || this.el).dom.clientWidth; // fallback in case grid is not rendered (no rows/table)

            return new Ext.util.Region(Math.min(startY, endY), width, Math.max(startY, endY), 0);
        },

        /**
        * Gets the start and end dates for an element Region
        * @param {Region} region The region to map to start and end dates
        * @param {String} roundingMethod The rounding method to use
        * @returns {Object} an object containing start/end properties
        */
        getStartEndDatesFromRegion: function (region, roundingMethod) {
            var topDate = this.getDateFromXY([region.left, region.top], roundingMethod),
                bottomDate = this.getDateFromXY([region.right, region.bottom], roundingMethod);
        
            if (top && bottomDate) {
                return {
                    start : Sch.util.Date.min(topDate, bottomDate),
                    end : Sch.util.Date.max(topDate, bottomDate)
                };
            } else {
                return null;
            }
        },

        /**
        * Returns the amount of pixels for a single unit
        * @private
        * @return {String} The unit in pixel
        */
        getSingleTickInPixels: function () {
            return this.rowHeight;
        },

        // private
        timeColumnRenderer: function (v, m, rec, row, col, ds) {
            var ta = this.timeAxis,
                rowTick = ta.getAt(row),
                rowStart = rowTick.start,
                rowEnd = rowTick.end,
                resourceStore = this.resourceStore,
                resource = resourceStore.getAt(col),
                retVal = this.timeCellRenderer.call(this.timeCellRendererScope || this, m, resource, row, col, resourceStore, rowStart, rowEnd);

            // Thanks Condor for this fix!
            if (Ext.isIE) {
                m.style += ';z-index:' + (this.store.getCount() - row);
            }
            
            if (col % 2 === 1) {
                m.tdCls += ' ' + this.altColCls;
            }

            return retVal;
        },
        
        
        setColumnWidth : function (width, preventRefresh) {
            if (this.panel) {
                this.panel.resourceColumnWidth = width;
            }
        
            var headerCt    = this.headerCt;
        
            headerCt.suspendLayout = true;
        
            headerCt.items.each(function (column) {
                if (column.rendered) {
                    // otherwise column "remembers" its width and doesn't update
                    column.minWidth    = undefined;
            
                    column.setWidth(width);
                }
            });
        
            headerCt.suspendLayout = false;
        
            headerCt.doLayout();
        
            if (!preventRefresh) {
                this.refresh();
            }
            
            this.fireEvent('columnwidthchange', this, width);
        }

    }
}); 

/**
@class Sch.selection.EventModel
@extends Ext.selection.Model

This class provides the basic implementation event selection in a grid.

*/
Ext.define("Sch.selection.EventModel", {
    extend      : 'Ext.selection.Model',
    
    alias       : 'selection.eventmodel',
    
    requires    : [ 'Ext.util.KeyNav' ],

    /**
     * @cfg {Boolean} deselectOnContainerClick `True` to deselect all events when user clicks on free space in scheduler (outside of any event). Default is `true`. 
     */
    deselectOnContainerClick : true,
    
    
    constructor: function(cfg){
        this.addEvents(
            /**
             * @event beforedeselect
             * Fired before a record is deselected. If any listener returns false, the
             * deselection is cancelled.
             * @param {Sch.selection.EventModel} this
             * @param {Sch.model.Event} record The selected event
             */
            'beforedeselect',
            
            /**
             * @event beforeselect
             * Fired before a record is selected. If any listener returns false, the
             * selection is cancelled.
             * @param {Sch.selection.EventModel} this
             * @param {Sch.model.Event} record The selected event
             */
            'beforeselect',

            /**
             * @event deselect
             * Fired after a record is deselected
             * @param {Sch.selection.EventModel} this
             * @param {Sch.model.Event} record The selected event
             */
            'deselect',
            
            /**
             * @event select
             * Fired after a record is selected
             * @param {Sch.selection.EventModel} this
             * @param {Sch.model.Event} record The selected event
             */
            'select'
        );
        this.callParent(arguments);
    },
    
    // Overridden to prevent default grid overwriting the eventStore binding
    bind : function(store, initial){
        this.callParent([this.view.getEventStore(), initial]);
    },

    bindComponent: function(view) {
        var me = this,
            eventListeners = {
                refresh: me.refresh,
                scope: me
            };

        me.view = view;
        me.bind(view.getEventStore());

        view.on({
            eventclick : me.onEventClick,
            itemclick : me.onItemClick,
            scope : this
        });

        view.on(eventListeners);
    },

    onEventClick: function(view, record, e) {
        this.selectWithEvent(record, e);
    },

    onItemClick: function() {
        if (this.deselectOnContainerClick) {
            this.deselectAll();
        }
    },
    
    onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
         var me      = this,
            view   = me.view,
            store   = me.store,
            eventName = isSelected ? 'select' : 'deselect',
            i = 0;
            
        if ((suppressEvent || me.fireEvent('before' + eventName, me, record)) !== false &&
                commitFn() !== false) {

            if (isSelected) {
                view.onEventSelect(record, suppressEvent);
            } else {
                view.onEventDeselect(record, suppressEvent);
            }

            if (!suppressEvent) {
                me.fireEvent(eventName, me, record);
            }
        }
    },

    // Not supported.
    selectRange : function(){},

    selectNode: function(node, keepExisting, suppressEvent) {
        var r = this.view.resolveEventRecord(node);
        if (r) {
            this.select(r, keepExisting, suppressEvent);
        }
    },

    deselectNode: function(node, keepExisting, suppressEvent) {
        var r = this.view.resolveEventRecord(node);
        if (r) {
            this.deselect(r, suppressEvent);
        }
    }
});
/**
@class Sch.mixin.TimelineView
 
A base mixing for {@link Ext.view.View} classes, giving to the consuming view the "time line" functionality. 
This means that the view will be capabale to display a list of "events", ordered on the {@link Sch.data.TimeAxis time axis}.

By itself this mixin is not enough for correct rendering. The class, consuming this mixin, should also consume one of the 
{@link Sch.view.Horizontal} or {@link Sch.view.Vertical} mixins, which provides the implementation of some orientation-specfic methods.

Generally, should not be used directly, if you need to subclass the view, subclass the {@link Sch.view.SchedulerGridView} or {@link Sch.view.SchedulerTreeView} 
instead.

*/
Ext.define("Sch.mixin.TimelineView", {
    requires: [
        'Sch.column.Time', 
        'Sch.data.TimeAxis'
    ],

    // TODO move to panel level, this is where forceFit is defined in Ext 4
    forceFit            : false,
                
    /**
    * @cfg {String} orientation The view orientation
    */
    orientation: 'horizontal',
    
    /**
    * @cfg {String} overScheduledEventClass
    * A CSS class to apply to each event in the view on mouseover (defaults to 'sch-event-hover').
    */
    overScheduledEventClass: 'sch-event-hover',

    /**
    * @cfg {String} selectedEventCls
    * A CSS class to apply to each event in the view on mouseover (defaults to 'sch-event-selected').
    */
    selectedEventCls : 'sch-event-selected',
    
    // private
    altColCls : 'sch-col-alt',
        
    timeCellCls : 'sch-timetd',
    timeCellSelector : '.sch-timetd',

    ScheduleEventMap    : {
        click           : 'Click',
        dblclick        : 'DblClick',
        contextmenu     : 'ContextMenu',
        keydown         : 'KeyDown'
    },
        
    suppressFitCheck        : 0,

    inheritables : function() {
        return {
            cellBorderWidth : 1,
        
            // private
            initComponent: function () {
            
                this.setOrientation(this.panel._top.orientation || this.orientation);
        
                this.addEvents(
                    /**
                    * @event beforetooltipshow
                    * Fires before the event tooltip is shown, return false to suppress it.
                    * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                    * @param {Ext.data.Model} eventRecord The event record of the clicked record
                    */
                    'beforetooltipshow',

                    /**
                    * @event scheduleclick
                    * Fires after a click on the schedule area
                    * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                    * @param {Date} clickedDate The clicked date 
                    * @param {Int} rowIndex The row index 
                    * @param {Ext.EventObject} e The event object
                    */
                    'scheduleclick',

                    /**
                    * @event scheduledblclick
                    * Fires after a doubleclick on the schedule area
                    * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                    * @param {Date} clickedDate The clicked date 
                    * @param {Int} rowIndex The row index 
                    * @param {Ext.EventObject} e The event object
                    */
                    'scheduledblclick',

                    /**
                    * @event schedulecontextmenu
                    * Fires after a context menu click on the schedule area
                    * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                    * @param {Date} clickedDate The clicked date 
                    * @param {Int} rowIndex The row index 
                    * @param {Ext.EventObject} e The event object
                    */
                    'schedulecontextmenu',
                
                    'columnwidthchange'
                );
            
                this.enableBubble('columnwidthchange');
        
                var largeUnits = {},
                    D = Sch.util.Date;

                largeUnits[D.DAY] = largeUnits[D.WEEK] = largeUnits[D.MONTH] = largeUnits[D.QUARTER] = largeUnits[D.YEAR] = null;

                Ext.applyIf(this, {
                    eventPrefix : this.id + '-',
                    largeUnits : largeUnits
                });

                this.callParent(arguments);
            
                if (this.orientation === 'horizontal') {
                    this.getTimeAxisColumn().on('timeaxiscolumnreconfigured', this.checkHorizontalFit, this);
                }

                var pnl = this.panel._top;

                Ext.apply(this, {
                    eventRenderer : pnl.eventRenderer,
                    eventBorderWidth: pnl.eventBorderWidth,
                    timeAxis : pnl.timeAxis,
                    dndValidatorFn : pnl.dndValidatorFn || Ext.emptyFn,
                    resizeValidatorFn : pnl.resizeValidatorFn || Ext.emptyFn,
                    createValidatorFn : pnl.createValidatorFn || Ext.emptyFn,
                    tooltipTpl : pnl.tooltipTpl,
                    weekStartDay: pnl.weekStartDay,
                    validatorFnScope : pnl.validatorFnScope || this,
                    snapToIncrement: pnl.snapToIncrement,
                    timeCellRenderer: pnl.timeCellRenderer,
                    timeCellRendererScope: pnl.timeCellRendererScope,
                    readOnly: pnl.readOnly,
                    eventResizeHandles: pnl.eventResizeHandles,
                    enableEventDragDrop: pnl.enableEventDragDrop,
                    enableDragCreation: pnl.enableDragCreation,
                    dragConfig : pnl.dragConfig,
                    dropConfig : pnl.dropConfig,
                    resizeConfig : pnl.resizeConfig,
                    createConfig : pnl.createConfig,
                    tipCfg : pnl.tipCfg,
                    orientation : pnl.orientation,
                    getDateConstraints : pnl.getDateConstraints || Ext.emptyFn
                });
            },    

            initFeatures : function() {
                this.features = this.features || [];
                this.features.push({
                    ftype: 'scheduling'
                });
                this.callParent(arguments);
            },

             // private, clean up
            onDestroy: function () {
                if (this.tip) {
                    this.tip.destroy();
                }
                this.callParent(arguments);
            },

            afterComponentLayout : function () {
                this.callParent(arguments);
            
                if (!this.lockable && !this.suppressFitCheck) {
                    this.checkHorizontalFit();
                }
            },

            // private
            onRender: function () {

                this.callParent(arguments);
            
                this.el.addCls("sch-timelineview");
        
                if (this.readOnly) {
                    this.el.addCls(this._cmpCls + '-readonly');
                }

                if (this.overScheduledEventClass) {
                    this.mon(this.el, {
                        "mouseover": this.onMouseOver,
                        "mouseout": this.onMouseOut,
                        delegate: this.eventSelector,
                        scope: this
                    });
                }

                if (this.tooltipTpl) {
                    this.setupTooltip();
                }
        
                this.setupTimeCellEvents();
            },

            processUIEvent: function(e){
                var me = this,
                    eventBarNode = e.getTarget(this.eventSelector),
                    map = me.ScheduleEventMap,
                    type = e.type;
            
                if (eventBarNode && type in map) {
                    this.fireEvent(this.scheduledEventName + type, this, this.resolveEventRecord(eventBarNode), e);
                } else {
                    this.callParent(arguments);
                }
            }
           
    //        refresh : function () {
    //            console.time('TimelineView#refresh')
    //            
    //            this.callParent()
    //            
    //            console.timeEnd('TimelineView#refresh')
    //        }
        };
    },
        
    /**
        * Returns true, if there are any columns with `position : right` provided to this view
        * @return {Boolean} The formatted date
        */
    hasRightColumns : function () {
        return this.headerCt.items.getCount() > 1;
    },
        
        
    // returns `false` if the refresh has been happened
    checkHorizontalFit : function () {
        if (this.orientation === 'horizontal') {
                
            var actualWidth     = this.getActualTimeColumnWidth();
            var fittingWidth    = this.getFittingColumnWidth();
                
            if (this.forceFit) {
                // XXX the check for `this.hasRightColumns()` is only required because otherwise layouting system of ExtJS
                // goes into infinite recursive loop (4.0.2a)
                // need to periodically check if it can be removed 
                if (fittingWidth != actualWidth || this.hasRightColumns()) {
                    this.fitColumns();
                }
            } else if (this.snapToIncrement) {
                var snapColumnWidth    = this.calculateTimeColumnWidth(actualWidth);
                if (snapColumnWidth !== actualWidth) {
                    this.setColumnWidth(snapColumnWidth);
                }
            } else if (actualWidth < fittingWidth) {
                this.fitColumns();
            }
        }
    },
        
   
        
    getTimeAxisColumn : function () {
        return this.headerCt.items.get(0);
    },
        

    // private
    getNumberOfTimeColumns: function () {
        return this.timeAxis.getCount();
            
//            return this.getTimeAxisColumn().getColumnCount();
    },

        
    getFirstTimeColumn : function () {
        return this.headerCt.getGridColumns()[0];
    },
        
    
    /**
    * Method to get a formatted display date
    * @private
    * @param {Date} date The date
    * @return {String} The formatted date
    */
    getFormattedDate: function (date) {
        return Ext.Date.format(date, this.getDisplayDateFormat());
    },

    /**
    * Method to get a formatted end date for a scheduled event, the grid uses the "displayDateFormat" property defined in the current view preset.
    * @private
    * @param {Date} endDate The date to format
    * @param {Date} startDate The start date 
    * @return {String} The formatted date
    */
    getFormattedEndDate: function (endDate, startDate) {
        var ta = this.timeAxis,
            resUnit = ta.getResolution().unit;

        // If resolution is day or greater, and end date is greater then start date
        if (resUnit in this.largeUnits && endDate.getHours() === 0 && endDate.getMinutes() === 0 &&
            !(endDate.getYear() === startDate.getYear() && endDate.getMonth() === startDate.getMonth() && endDate.getDate() === startDate.getDate())) {
            endDate = Sch.util.Date.add(endDate, Sch.util.Date.DAY, -1);
        }
                
//            // experimental, this should turn "<" into "<="
//            endDate = Sch.util.Date.add(endDate, Sch.util.Date.MILLI, -1);
                
        return Ext.Date.format(endDate, this.getDisplayDateFormat());
    },

    // private
    getDisplayDateFormat: function () {
        return this.displayDateFormat;
    },

    // private
    setDisplayDateFormat: function (format) {
        this.displayDateFormat = format;
    },
   

    /**
    * Returns the amount of pixels for a single unit
    * @private
    * @return {String} The unit in pixel
    */
    getSingleUnitInPixels: function (unit) {
        return Sch.util.Date.getUnitToBaseUnitRatio(this.timeAxis.getUnit(), unit) * this.getSingleTickInPixels();
    },

    /**
    * Returns the amount of pixels for a single unit
    * @private
    * @return {String} The unit in pixel
    */
    getSingleTickInPixels: function () {
        throw 'Must be implemented by horizontal/vertical';
    },

    /**
    *  Scrolls an event record into the viewport (only works for events that have already been rendered)
    *  @param {Ext.data.Model} eventRec, the event record to scroll into view
    *  @param {Mixed} highlight, either true/false or a highlight config object used to highlight the element after scrolling it into view
    */
    scrollEventIntoView: function (eventRec, highlight) {
        var el = this.getOuterElementFromEventRecord(eventRec);

        if (el) {
            var panel       = this.up('[scrollerOwner]'),
                hScroller   = panel.getHorizontalScroller(),
                vScroller   = panel.getVerticalScroller();
                    
            var node        = el.up(this.getItemSelector());
                    
            hScroller && hScroller.setScrollLeft(el.getLeft(true));
            vScroller && vScroller.setScrollTop(node.dom.offsetTop);
                
            if (highlight) {
                if (typeof highlight === "boolean") {
                    el.highlight();
                } else {
                    el.highlight(null, highlight);
                }
            }
        }
    },

    // private, TODO move to panel level, this is also where forceFit is defined
    calculateTimeColumnWidth: function (proposedTimeColumnWidth) {
        if (!this.panel.rendered) {
            return proposedTimeColumnWidth;
        }
        
        var width           = 0,
            timelineUnit    = this.timeAxis.getUnit(),
            nbrTimeColumns  = this.timeAxis.getCount(),
            ratio           = Number.MAX_VALUE;
            
        if (this.snapToIncrement) {
            var res         = this.timeAxis.getResolution(),
                unit        = res.unit,
                resIncr     = res.increment;

            ratio = Sch.util.Date.getUnitToBaseUnitRatio(timelineUnit, unit) * resIncr;
        }
            
        var measuringUnit   = Sch.util.Date.getMeasuringUnit(timelineUnit);

        ratio               = Math.min(ratio, Sch.util.Date.getUnitToBaseUnitRatio(timelineUnit, measuringUnit));
            
        var fittingWidth    = Math.floor(this.getAvailableWidthForSchedule() / nbrTimeColumns);

        width               = this.forceFit || proposedTimeColumnWidth < fittingWidth ? fittingWidth : proposedTimeColumnWidth;

        if (!this.forceFit || ratio < 1) {
            width = Math.round(Math[this.forceFit ? 'floor' : 'round'](ratio * width) / ratio);
        }
            
        return width;
    },
        
        
    getFittingColumnWidth : function () {
        var proposedWidth   = Math.floor(this.getAvailableWidthForSchedule() / this.getNumberOfTimeColumns());
            
        return this.calculateTimeColumnWidth(proposedWidth);
    },
        
        
    /**
        * This function fits the time columns into the available space in the grid.
        * @param {Boolean} preventRefresh `true` to prevent the refresh of view
        */ 
    fitColumns: function (preventRefresh) {
        var w = 0;
            
        if (this.orientation === 'horizontal') {
            w = this.getFittingColumnWidth();
        } else {
            w = Math.floor((this.panel.getWidth() - Ext.getScrollBarWidth() - 1) / this.headerCt.getColumnCount());
        }
            
        // will call `refresh` if `preventRefresh` is not true
        this.setColumnWidth(w, preventRefresh);
    },
    
    // private
    getAvailableWidthForSchedule: function () {
        var available   = this.panel.getWidth();
            
        // substracting the widths of all columns starting from 2nd ("right" columns)
        for (var i = 1; i < this.headerCt.items.getCount(); i++) {
            available -= this.headerCt.items.get(i).getWidth();
        }
            
        return available - Ext.getScrollBarWidth() - 1;
    },

    /**
    * <p>Returns the Ext Element representing an event record</p> 
    * @param {Ext.data.Model} record The record
    * @return {Ext.Element} The Ext Element representing the event record
    */
    getElementFromEventRecord: function (record) {
        return Ext.get(this.eventPrefix + record.internalId);
    },
        
        
    getEventNodeByRecord: function(record) {
        return document.getElementById(this.eventPrefix + record.internalId);
    },

        
    /**
    * <p>Returns the Ext Element representing an event record</p> 
    * @param {Ext.data.Model} record The record
    * @return {Ext.Element} The Ext Element representing the event record
    */
    getOuterElementFromEventRecord: function (record) {
        return Ext.get(this.eventPrefix + record.internalId);
    },
        

    // private
    resolveColumnIndex: function (x) {
        return Math.floor(x/this.getActualTimeColumnWidth());
    },

    /**
    * Gets the start and end dates for an element Region
    * @param {Region} region The region to map to start and end dates
    * @param {String} roundingMethod The rounding method to use
    * @returns {Object} an object containing start/end properties
    */
    getStartEndDatesFromRegion: function (region, roundingMethod) {
        throw 'Must be implemented by horizontal/vertical';
    },

    
    // private
    setupTooltip: function () {
        var me = this,
            tipCfg = Ext.apply({
                renderTo: Ext.getBody(),
                delegate: me.eventSelector,
                target: me.el,
                anchor: 'b'
            }, me.tipCfg);    

        me.tip = Ext.create('Ext.ToolTip', tipCfg);
        me.tip.on({
            beforeshow: function (tip) {
                if (!tip.triggerElement || !tip.triggerElement.id) {
                    return false;
                }

                var record = this.resolveEventRecord(tip.triggerElement);

                if (!record || this.fireEvent('beforetooltipshow', this, record) === false) {
                    return false;
                }

                tip.update(this.tooltipTpl.apply(this.getDataForTooltipTpl(record)));

                return true;
            },
            scope: this
        });
    },

    getDataForTooltipTpl : function(record) {
        return record.data;
    },

        /**
    * Returns the current time resolution object, which contains a unit identifier and an increment count.
    * @return {Object} The time resolution object
    */
    getTimeResolution: function () {
        return this.timeAxis.getResolution();
    },

    /**
    * Sets the current time resolution, composed by a unit identifier and an increment count.
    * @return {Object} The time resolution object
    */
    setTimeResolution: function (unit, increment) {
        this.timeAxis.setResolution(unit, increment);

        // View will have to be updated to support snap to increment
        if (this.snapToIncrement) {
            this.refresh(true);
        }
    },

    /**
    * <p>Returns the event id for a DOM id </p>
    * @private
    * @param {String} id The id of the DOM node
    * @return {Ext.data.Model} The event record
    */
    getEventIdFromDomNodeId: function (id) {
        return id.substring(this.eventPrefix.length);
    },

     
    /**
    *  Gets the time for a DOM event such as 'mousemove' or 'click'
    *  @param {Ext.EventObject} e, the EventObject instance
    *  @param {String} roundingMethod (optional), 'floor' to floor the value or 'round' to round the value to nearest increment
    *  @returns {Date} The date corresponding to the EventObject x coordinate
    */
    getDateFromDomEvent : function(e, roundingMethod) {
        return this.getDateFromXY(e.getXY(), roundingMethod);
    },

    // private
    handleScheduleEvent : function(e) {
        var t = e.getTarget('.' + this.timeCellCls, 2);

        if (t) {
            var clickedDate = this.getDateFromDomEvent(e, 'floor');
            this.fireEvent('schedule' + e.type, this, clickedDate, this.indexOf(this.findItemByChild(t)), e);
        }
    },
        
    setupTimeCellEvents: function () {
        this.mon(this.el, {
            click: this.handleScheduleEvent,
            dblclick: this.handleScheduleEvent,
            contextmenu: this.handleScheduleEvent,
            scope: this
        }, this);
    },

    /**
    * [Experimental] Returns the pixel increment for the current view resolution.
    * @return {Int} The width increment
    */
    getSnapPixelAmount: function () {
        if (this.snapToIncrement) {
            var resolution = this.timeAxis.getResolution();
            return (resolution.increment || 1) * this.getSingleUnitInPixels(resolution.unit);
        } else {
            return 1;
        }
    },

    getActualTimeColumnWidth : function() {
        return this.headerCt.items.get(0).getTimeColumnWidth();
    },

    /**
    * Controls whether the scheduler should snap to the resolution when interacting with it.
    * @param {Boolean} enabled true to enable snapping when interacting with events.
    */
    setSnapEnabled: function (enabled) {
        this.snapToIncrement = enabled;

        if (enabled) {
            this.refresh(true);
        }
    },

    /**
    * Sets the readonly state which limits the interactivity (resizing, drag and drop etc).
    * @param {Boolean} readOnly The new readOnly state
    */
    setReadOnly: function (readOnly) {
        this.readOnly = readOnly;
        this.el[readOnly ? 'addCls' : 'removeCls'](this._cmpCls + '-readonly');
    },

        
    /**
        * Sets the current orientation.
        * 
        * @param {String} orientation Either 'horizontal' or 'vertical'
        */
    setOrientation : function(orientation) {
        this.orientation = orientation; 
        // Apply the orientation specific view methods/properties from the horizontal or vertical meta classes
        Ext.apply(this, Sch.view[orientation.substr(0, 1).toUpperCase() + orientation.substring(1)].prototype.props);
    },

    /**
    * Returns the current view orientation
    * @return {String} The view orientation ('horizontal' or 'vertical')
    */
    getOrientation: function () {
        return this.orientation;
    },
       
    // private
    onMouseOver: function (e, t) {
        if (t !== this.lastItem) {
            this.lastItem = t;
            Ext.fly(t).addCls(this.overScheduledEventClass);
        }
    },

    // private
    onMouseOut: function (e, t) {
        if (this.lastItem) {
            if (!e.within(this.lastItem, true, true)) {
                Ext.fly(this.lastItem).removeCls(this.overScheduledEventClass);
                delete this.lastItem;
            }
        }
    },
    

    // Overridden since locked grid can try to highlight items in the unlocked grid while it's loading/empty
    highlightItem: function(item) {
        if (item) {
            var me = this;
            me.clearHighlight();
            me.highlightedItem = item;
            Ext.fly(item).addCls(me.overItemCls);
        }
    },

    translateToScheduleCoordinate: function (x) {
        throw 'Abstract method call!';
    },

    translateToPageCoordinate: function (x) {
        throw 'Abstract method call!';
    },

    /**
    * Gets the date for an XY coordinate
    * @param {Array} xy The page X and Y coordinates
    * @param {String} roundingMethod The rounding method to use
    * @returns {Date} the Date corresponding to the xy coordinate
    * @abstract
    */
    getDateFromXY: function (xy, roundingMethod) {
        throw 'Abstract method call!';
    },

    /**
    *  Gets xy coordinates relative to the element containing the time columns time for a date
    *  @param {Date} xy, the page X and Y coordinates
    *  @param {Boolean} local, true to return a coordinate local to the element containing the calendar columns
    *  @returns {Array} the XY coordinates representing the date
    */
    getXYFromDate: function (date, local) {
        throw 'Abstract method call!';
    },

    /**
    *  Returns the region for a "global" time span in the view. Coordinates are relative to element containing the time columns
    *  @param {Date} startDate The start date of the span
    *  @param {Date} endDate The end date of the span
    *  @return {Ext.util.Region} The region for the time span
    */
    getTimeSpanRegion: function (startDate, endDate) {
        throw 'Abstract method call!';
    },

    /**
    * Method to get a the current start date of the scheduler view
    * @return {Date} The start date
    */
    getStart: function () {
        return this.timeAxis.getStart();
    },

    /**
    * Method to get a the current end date of the scheduler view
    * @return {Date} The end date
    */
    getEnd: function () {
        return this.timeAxis.getEnd();
    },

    /**
    * Sets the amount of margin to keep between bars and rows.
    * @param {Int} margin The new margin value
    * @param {Boolean} preventRefresh true to skip refreshing the view
    */
    setBarMargin: function (margin, preventRefresh) {
        this.barMargin = margin;
        if (!preventRefresh) {
            this.refresh();
        }
    },

        
    /**
        * Sets the height of row
        * @param {Number} height The height to set
        * @param {Boolean} preventRefresh `true` to prevent view refresh
        */
    setRowHeight: function (height, preventRefresh) {
        this.rowHeight = height || 24;
 
        if (this.rendered && !preventRefresh) {
            this.refresh();
        }
    }//,
     
    /**
        * Sets the width of individual time column
        * @param {Number} width The width to set
        * @param {Boolean} preventRefresh `true` to prevent view refresh
        */
//    setColumnWidth : function (width, preventRefresh) {
//        throw 'Abstract method call!';
//    }
});


/**

@class Sch.view.TimelineGridView
@extends Ext.grid.View
@mixin Sch.mixin.TimelineView

A grid view class, that have consumed the {@link Sch.mixin.TimelineView} mixin. Used internally.

*/

Ext.define("Sch.view.TimelineGridView", {
    extend      : "Ext.grid.View",
    mixins      : ['Sch.mixin.TimelineView']
}, function() {
    this.override(Sch.mixin.TimelineView.prototype.inheritables() || {});
});
/**

@class Sch.mixin.SchedulerView

A mixin for {@link Ext.view.View} classes, providing "scheduling" functionality to the consuming view. A consuming class
should have already consumed the {@link Sch.mixin.TimelineView} mixin.

Generally, should not be used directly, if you need to subclass the view, subclass the {@link Sch.view.SchedulerGridView} or {@link Sch.view.SchedulerTreeView} 
instead.

*/
Ext.define('Sch.mixin.SchedulerView', {
    uses        : [
        'Sch.tooltip.Tooltip'
    ],
    requires    : [
        "Sch.data.EventStoreAdaptions", 
        'Sch.feature.DragCreator',
        'Sch.feature.DragDrop',
        'Sch.feature.ResizeZone',
        'Sch.column.Resource',
        'Sch.view.Horizontal',
        'Sch.view.Vertical'
    ],

     _cmpCls                 : 'sch-schedulerview',
    scheduledEventName      : 'event',

    /**
    * @cfg {Int} barMargin
    * Controls how much space to leave between the event bars and the row borders.
    */
    barMargin               : 1,
    
    /**
    * @cfg {String} eventResizeHandles Defines which resize handles to use. Possible values: 'none', 'start', 'end', 'both'. Defaults to 'end'
    */
    eventResizeHandles      : 'end',
    
    /**
    * @cfg {Boolean} allowOverlap Set to false if you don't want to allow events overlapping (defaults to true).
    */
    allowOverlap            : true,

    /**
    * @cfg {Boolean} constrainDragToResource true to only only dragging events within the same resource.
    */
    constrainDragToResource : false,
    
    /**
    * @cfg {Boolean} readOnly true to disable editing and interaction such as drag and drop, resizing and creation of new events.
    */
    readOnly                : false,

    /**
    * @cfg {Boolean} dynamicRowHeight
    * True to layout events without overlapping, meaning the row height will be dynamically calculated to fit any overlapping events.
    */
    dynamicRowHeight        : true,

    /**
    * @cfg {Boolean} managedEventSizing
    * True to size events based on the rowHeight and barMargin settings. Set this to false if you want to control height and top properties via CSS instead.
    */
    managedEventSizing      : true,

    eventSelector           : '.sch-event',

    eventTpl : [
        '<tpl for=".">',
            '<div unselectable="on" id="{{evt-prefix}}{id}" style="left:{left}px;top:{top}px;height:{height}px;width:{width}px;{style}" class="sch-event x-unselectable {internalcls} {cls}">',
                '<div unselectable="on" class="sch-event-inner {iconCls}">',
                    '{body}',
                '</div>',
            '</div>',
        '</tpl>'
    ],
    
    /**
    * An empty function by default, but provided so that you can perform custom validation on 
    * the item being dragged. This function is called during a drag and drop process and also after the drop is made
    * @param {Array} dragRecords an array containing the records for the events being dragged
    * @param {Sch.model.Resource} targetResourceRecord the target resource of the the event 
    * @param {Date} date The date corresponding to the drag proxy position
    * @param {Int} duration The duration of the item being dragged in milliseconds
    * @param {Event} e The event object
    * @return {Boolean} true if the drop position is valid, else false to prevent a drop
    */
    dndValidatorFn: function (dragRecords, targetResourceRecord, date, duration, e) {
        return true;
    },

    /**
    * An empty function by default, but provided so that you can perform custom validation on 
    * an item being resized.
    * @param {Sch.model.Resource} resourceRecord the resource of the row in which the event is located
    * @param {Sch.model.Event} eventRecord the event being resized
    * @param {Date} startDate
    * @param {Date} endDate
    * @param {Event} e The event object
    * @return {Boolean} true if the resize state is valid, else false
    */
    resizeValidatorFn: function (resourceRecord, eventRecord, startDate, endDate, e) {
        return true;
    },

    /**
    * An empty function by default, but provided so that you can perform custom validation on the item being created
    * @param {Sch.model.Resource} resourceRecord the resource for which the event is being created
    * @param {Date} startDate
    * @param {Date} endDate
    * @param {Event} e The event object
    * @return {Boolean} true if the creation event is valid, else false
    */
    createValidatorFn: function (resourceRecord, startDate, endDate, e) {
        return true;
    },
        
    inheritables : function() {
        return {    

            // Configuring underlying grid view 
            loadingText             : 'Loading events...',
            trackOver               : false,
            overItemCls             : '',
            // EOF: Configuring underlying grid view 

            // private
            initComponent: function () {
            
                this.addEvents(
                    // Scheduled events: click events --------------------------

                    /**
                    * @event eventclick
                    * Fires when an event is clicked
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} eventRecord The event record of the clicked event
                    * @param {Ext.EventObject} e The event object
                    */
                    'eventclick',

                    /**
                    * @event eventdblclick
                    * Fires when an event is double clicked
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} eventRecord The event record of the clicked event
                    * @param {Ext.EventObject} e The event object
                    */
                    'eventdblclick',

                    /**
                    * @event eventcontextmenu
                    * Fires when contextmenu is activated on an event
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} eventRecord The event record of the clicked event
                    * @param {Ext.EventObject} e The event object
                    */
                    'eventcontextmenu',

                    // Resizing events start --------------------------
                    /**
                    * @event beforeeventresize
                    * Fires before a resize starts, return false to stop the execution
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} record The record about to be resized
                    * @param {Ext.EventObject} e The event object
                    */
                    'beforeeventresize',

                    /**
                    * @event eventresizestart
                    * Fires when resize starts
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} record The event record being resized
                    */
                    'eventresizestart',

                    /**
                    * @event eventpartialresize
                    * Fires during a resize operation and provides information about the current start and end of the resized event
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} record The event record being resized
                    * @param {Date} startDate The new start date of the event
                    * @param {Date} endDate The new end date of the event
                    * @param {Ext.Element} element The proxy element being resized
                    */
                    'eventpartialresize',

                    /**
                    * @event eventresizeend
                    * Fires after a succesful resize operation
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} record The updated event record
                    */
                    'eventresizeend',
                    // Resizing events end --------------------------

                    // Dnd events start --------------------------
                    /**
                    * @event beforeeventdrag
                    * Fires before a dnd operation is initiated, return false to cancel it
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} record The record corresponding to the node that's about to be dragged
                    * @param {Ext.EventObject} e The event object
                    */
                    'beforeeventdrag',

                    /**
                    * @event eventdragstart
                    * Fires when a dnd operation starts
                    * @param {SchedulerPanel} scheduler The scheduler object
                    * @param {Array} records the records being dragged
                    */
                    'eventdragstart',

                    /**
                    * @event eventdrop
                    * Fires after a succesful drag and drop operation
                    * @param {Mixed} view The scheduler view instance
                    * @param {[Sch.model.Event]} records the affected records (if copies were made, they were not inserted into the store)
                    * @param {Boolean} isCopy True if the records were copied instead of moved
                    */
                    'eventdrop',

                    /**
                    * @event aftereventdrop
                    * Fires when after a drag n drop operation, even when drop was performed on an invalid location
                    * @param {Mixed} view The scheduler view instance
                    */
                    'aftereventdrop',
                    // Dnd events end --------------------------

                    // Drag create events start --------------------------
                    /**
                    * @event beforedragcreate
                    * Fires before a drag starts, return false to stop the execution
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Resource} resource The resource record
                    * @param {Ext.EventObject} e The event object
                    */
                    'beforedragcreate',

                    /**
                    * @event dragcreatestart
                    * Fires before a drag starts, return false to stop the execution
                    * @param {Mixed} view The scheduler view instance
                    */
                    'dragcreatestart',

                    /**
                    * @event dragcreateend
                    * Fires after a successful drag-create operation
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} newEventRecord The newly created event record (added to the store in onEventCreated method)
                    * @param {Sch.model.Resource} resource The resource record to which the event belongs
                    * @param {Ext.EventObject} e The event object
                    */
                    'dragcreateend',

                    /**
                    * @event afterdragcreate
                    * Always fires after a drag-create operation
                    * @param {Mixed} view The scheduler view instance
                    */
                    'afterdragcreate',
                    // Drag create events end --------------------------

                    /**
                    * @event beforeeventadd
                    * Fires after a successful drag-create operation, before the new event is added to the store. Return false to prevent the event from being added to the store.
                    * @param {Mixed} view The scheduler view instance
                    * @param {Sch.model.Event} newEventRecord The newly created event record 
                    */
                    'beforeeventadd'
                );

                this.callParent(arguments);
                var pnl = this.panel._top;

                Ext.apply(this, {
                    eventStore          : pnl.eventStore,
                    resourceStore       : pnl.resourceStore,
                
                    eventBodyTemplate   : pnl.eventBodyTemplate,
                    eventTpl       : pnl.eventTpl || this.eventTpl,
                    eventBarTextField   : pnl.eventBarTextField,
                    allowOverlap   : pnl.allowOverlap,
                
                    eventBarIconClsField        : pnl.eventBarIconClsField,
                    onEventCreated              : pnl.onEventCreated  || Ext.emptyFn,
                    constrainDragToResource     : pnl.constrainDragToResource
                });

                var me = this;
        
                if(Ext.isArray(me.eventTpl)){
                    var clone = Ext.Array.clone(me.eventTpl),
                        resizeTpl = '<div class="sch-resizable-handle sch-resizable-handle-{0}"></div>';

                    if (this.eventResizeHandles === 'start' ||  this.eventResizeHandles === 'both') {
                        clone.splice(2, 0, Ext.String.format(resizeTpl, 'start'));
                    }
                    if (this.eventResizeHandles === 'end' ||  this.eventResizeHandles === 'both') {
                        clone.splice(2, 0, Ext.String.format(resizeTpl, 'end'));
                    }

                    var tplString = clone.join('').replace('{{evt-prefix}}', this.eventPrefix);
                    me.eventTpl = Ext.create('Ext.XTemplate', tplString);
                }
           
                var es = this.eventStore;
                es.self.mixin('storeadaptions', Sch.data.EventStoreAdaptions);
                es.adaptEventStore();

                this.configureFunctionality();

                this.setupEventListeners();
            },
            
        
            setReadOnly: function (readOnly) {
                if (this.dragCreator) {
                    this.dragCreator.setDisabled(readOnly);
                }
                this.callParent(arguments);
            },

            prepareData: function(data, idx, record) {
                var orig     = this.callParent(arguments);
                orig = this.collectRowData(orig, record, idx);
                return orig;
            }, 

             bindStore : function() {
                // Disable the loadmask while underlying grid implementation is binding the store which 
                // will cause an undesirable masking if resourceStore is loading
                if (this.loadMask) {
                    this.loadMask.disable();
                }
        
                this.callParent(arguments);

                // Re-enable loadmask again
                if (this.loadMask) {
                    this.loadMask.enable();
                }
            },
        
            afterRender : function() {
                this.callParent(arguments);
                this.el.addCls(this._cmpCls);
            
                if (this.enableAnimations) {
                    this.el.addCls('sch-animations-enabled');
                }
                this.bindEventStore(this.eventStore, true);

                this.headerCt.resizer.doResize = Ext.Function.createSequence(this.headerCt.resizer.doResize, this.afterHeaderResized, this);
            },

        
            // private, clean up
            onDestroy : function() {
                this.bindEventStore(null);
                this.callParent(arguments);
            }
        };
    },
        
        
    /**
    * Returns the current row height used by the view (only applicable in a horizontal view)
    * @return {Boolean} The row height
    */
    getRowHeight: function () {
        return this.rowHeight;
    },
    

    /**
    *  Takes a global page-X coordinate and returns the x position on the SchedulerView element.
    *  @private
    *  @param {Int} x the page x coordinate
    *  @return {Int} The 'local' scheduler view X coordinate
    */
    translateToScheduleCoordinate: function (x) {
        throw 'Must be defined by horizontal/vertical class';
    },

    
    getEventBox : function(start, end) {
        throw 'Must be defined by horizontal/vertical class';
    },

    generateTplData : function(event, viewStart, viewEnd, resourceRecord, resourceIndex) {
        var start = event.getStartDate(),
            end = event.getEndDate(),
            eventBox = this.getEventBox(Sch.util.Date.max(start, viewStart), Sch.util.Date.min(end, viewEnd)),
            tplData = Ext.apply(eventBox, {
                id: event.internalId,
                internalcls: event.getCls() + (event.dirty ? ' sch-dirty ' : '') + (end > viewEnd ? ' sch-event-endsoutside ' : '') + (start < viewStart ? ' sch-event-startsoutside ' : '') + (this.eventBarIconClsField ? ' sch-event-withicon ' : ''),
                start : start,
                end : end,
                iconCls : event.data[this.eventBarIconClsField] || ''
            });
                    
        if (this.eventRenderer) {
            // User has specified a renderer fn, either to return a simple string, or an object intended for the eventBodyTemplate
            var value = this.eventRenderer.call(this, event, resourceRecord, tplData, resourceIndex);
            if (Ext.isObject(value) && this.eventBodyTemplate) {
                tplData.body = this.eventBodyTemplate.apply(value);
            } else {
                tplData.body = value;
            }
        } else if (this.eventBodyTemplate) {
            // User has specified an eventBodyTemplate, but no renderer - just apply the entire event record data.
            tplData.body = this.eventBodyTemplate.apply(event.data);
        } else if (this.eventBarTextField) {
            // User has specified a field in the data model to read from
            tplData.body = event.data[this.eventBarTextField];
        }
        return tplData;
    },
    
    sortEvents : function (a, b) {
        var sameStart = (a.start - b.start === 0);

        if (sameStart) {
            return a.end > b.end ? -1 : 1;
        } else {
            return (a.start < b.start) ? -1 : 1;
        }
    },

    // Layout the items to consume as little vertical space as possible
    layoutEvents: function (row) {
        throw 'Must be defined by horizontal/vertical class';
    },

    findClosestSuccessor: function (event, events) {
        var minGap = Infinity,
            closest,
            eventEnd = event.end,
            gap;

        for (var i = 0, l = events.length; i < l; i++) {
            gap = events[i].start - eventEnd;

            if (gap >= 0 && gap < minGap) {
                closest = events[i];
                minGap = gap;
            }
        }
        return closest;
    },

    // private
    resolveResource: function (t) {
        throw 'Must be defined by horizontal/vertical class';
    },

    /**
    * Gets the Ext.util.Region represented by the schedule and optionally only for a single resource. The view will ask the scheduler for 
    * the resource availability by calling getResourceAvailability. By overriding that method you can constrain events differently for
    * different resources.
    * @param {Sch.model.Resource} resourceRecord (optional) The resource record 
    * @param {Sch.model.Event} eventRecord (optional) The event record 
    * @return {Ext.util.Region} The region of the schedule
    */
    getScheduleRegion: function (resourceRecord, eventRecord) {
        throw 'Must be defined by horizontal/vertical class';
    },

    /**
    * <p>Returns the event record for a DOM element </p>
    * @param {mixed} el The DOM node or Ext Element to lookup
    * @return {Sch.model.Event} The event record
    */
    resolveEventRecord : function (el) {
        var element = Ext.get(el);
        if (!element.is(this.eventSelector)) {
            element = element.up(this.eventSelector);
        }
        return this.getEventRecordFromDomId(element.id);
    },
        
    // DEPRECATED
    getResourceByEventRecord : function(eventRecord) {
        return eventRecord.getResource();
    },

    /**
    * <p>Returns the event record for a DOM id </p>
    * @param {String} id The id of the DOM node
    * @return {Sch.model.Event} The event record
    */
    getEventRecordFromDomId: function (id) {
        var trueId = this.getEventIdFromDomNodeId(id);
        return this.eventStore.data.getByKey(trueId);
    },


    configureFunctionality: function () {
        var vfScope = this.validatorFnScope || this;

        if (this.eventResizeHandles !== 'none' && Sch.feature.ResizeZone) {
            this.resizePlug = Ext.create("Sch.feature.ResizeZone", Ext.applyIf({
                schedulerView : this,
                validatorFn: function (resourceRecord, eventRecord, startDate, endDate) {
                    return (this.allowOverlap || this.isDateRangeAvailable(startDate, endDate, eventRecord, resourceRecord)) &&
                            this.resizeValidatorFn.apply(vfScope, arguments) !== false;
                },
                validatorFnScope: this
            }, this.resizeConfig || {}));
        }

        if (this.enableEventDragDrop !== false && Sch.feature.DragDrop) {

            this.dragdropPlug = Ext.create("Sch.feature.DragDrop", this, {
                validatorFn: function (dragRecords, targetResourceRecord, date, duration, e) {
                    return (this.allowOverlap || this.isDateRangeAvailable(date, Sch.util.Date.add(date, Sch.util.Date.MILLI, duration), dragRecords[0], targetResourceRecord)) &&
                            this.dndValidatorFn.apply(vfScope, arguments) !== false;
                },
                validatorFnScope: this,
                dragConfig: this.dragConfig || {},
                dropConfig: this.dropConfig || {}
            });
        }

        if (this.enableDragCreation !== false && Sch.feature.DragCreator) {
            this.dragCreator = Ext.create("Sch.feature.DragCreator", Ext.applyIf({
                schedulerView : this,
                disabled: this.readOnly,
                validatorFn: function (resourceRecord, startDate, endDate) {
                    return (this.allowOverlap || this.isDateRangeAvailable(startDate, endDate, null, resourceRecord)) &&
                            this.createValidatorFn.apply(vfScope, arguments) !== false;
                },
                validatorFnScope: this
            }, this.createConfig || {}));
        }
    },

    /**
    * Checks if a date range is allocated or not for a given resource.
    * @param {Date} start The start date
    * @param {Date} end The end date
    * @param {Sch.model.Event} excludeEvent An event to exclude from the check (or null)
    * @param {Sch.model.Resource} resource The resource
    * @return {Boolean} True if the timespan is available for the resource
    */
    isDateRangeAvailable: function (start, end, excludeEvent, resource) {
        var available = true;
        this.eventStore.each(function (ev) {
            if (Sch.util.Date.intersectSpans(start, end, ev.getStartDate(), ev.getEndDate()) && 
                resource === ev.getResource() && 
                (!excludeEvent || excludeEvent !== ev)) {
                available = false;
                return false;
            }
        });
        return available;
    },

    /**
    * Returns events that are (partly or fully) inside the timespan of the current view.
    * @return {MixedCollection} The collection of events
    */
    getEventsInView: function () {
        var viewStart = this.timeAxis.getStart(),
            viewEnd = this.timeAxis.getEnd();

        return this.eventStore.queryBy(function (event) {
            var eventStart = event.getStartDate(),
                eventEnd = event.getEndDate();

            return Sch.util.Date.intersectSpans(eventStart, eventEnd, viewStart, viewEnd);
        });
    },

    /**
    * Returns the current set of rendered event nodes
    * @return {CompositeElement} The collection of event nodes
    */
    getEventNodes: function () {
        return this.el.select(this.eventSelector);
    },

    /**
    * Empty by default but provided so that you can override it. This is called when before a drag/resize/create operation which 
    * enables you to restrict the editing to a portion of the visible scheduler (for example the availability of a resource).
    * @param {Sch.model.Resource} resourceRecord The resource record
    * @param {Sch.model.Event/Date} eventRecord The resource record if operating on an existing event, or the clicked date if the operation is a create operation.
    */


    onBeforeDragDrop: function (s, rec, e) {
        return !this.readOnly && !e.getTarget().className.match('sch-resizable-handle');
    },

    onDragDropStart: function () {
        if (this.dragCreator) {
            this.dragCreator.setDisabled(true);
        }

        if (this.tip) {
            this.tip.hide();
            this.tip.disable();
        }
    },

    onDragDropEnd: function () {
        if (this.dragCreator) {
            this.dragCreator.setDisabled(false);
        }

        if (this.tip) {
            this.tip.enable();
        }
    },

    onBeforeDragCreate: function (s, resourceRecord, date, e) {
        return !this.readOnly && !e.ctrlKey;
    },

    onDragCreateStart: function () {
        if (this.overClass) {
            var v = this.getView().mainBody;
            this.mun(v, "mouseover", this.onMouseOver, this);
            this.mun(v, "mouseout", this.onMouseOut, this);
        }

        if (this.tip) {
            this.tip.hide();
            this.tip.disable();
        }
    },

    onDragCreateEnd: function (s, newEventRecord, e) {
        // If an event editor is defined, it has to manage how/if/when the event is added to the event store
        if (!this.eventEditor) {
            if (this.fireEvent('beforeeventadd', this, newEventRecord) !== false) {
                this.onEventCreated(newEventRecord);
                this.eventStore.add(newEventRecord);
            }
            this.dragCreator.getProxy().hide();
        }
    },

    onEventCreated: function (newEventRecord) {
        // Empty but provided so that you can override it to supply default record values etc.
    },

    onAfterDragCreate: function () {
        if (this.overClass) {
            this.mon(this.getView().mainBody, {
                "mouseover": this.onMouseOver,
                "mouseout": this.onMouseOut,
                scope: this
            });
        }

        if (this.tip) {
            this.tip.enable();
        }
    },

    onBeforeResize: function (s, rec, e) {
        return !this.readOnly;
    },

    onResizeStart: function () {
        if (this.tip) {
            this.tip.hide();
            this.tip.disable();
        }

        if (this.dragCreator) {
            this.dragCreator.setDisabled(true);
        }
    },

    onResizeEnd: function () {
        if (this.tip) {
            this.tip.enable();
        }

        if (this.dragCreator) {
            this.dragCreator.setDisabled(false);
        }
    },

    getEventStore : function() {
        return this.eventStore;
    },
    
    registerEventEditor: function (editor) {
        this.eventEditor = editor;
    },

    getEventEditor: function () {
        return this.eventEditor;
    },


    setupEventListeners: function () {
        this.on({
            beforeeventdrag: this.onBeforeDragDrop,
            eventdragstart: this.onDragDropStart,
            aftereventdrop: this.onDragDropEnd,

            beforedragcreate: this.onBeforeDragCreate,
            dragcreatestart: this.onDragCreateStart,
            dragcreateend: this.onDragCreateEnd,
            afterdragcreate: this.onAfterDragCreate,

            beforeeventresize: this.onBeforeResize,
            eventresizestart: this.onResizeStart,
            eventresizeend: this.onResizeEnd,

            scope: this
        });
    },

    // Call orientation specific implementation
    _onEventUpdate: function (store, model, operation) {
        this.onEventUpdate.apply(this, arguments);
    },

    // Call orientation specific implementation
    _onEventAdd: function (s, recs) {
        this.onEventAdd.apply(this, arguments);
    },

    // Call orientation specific implementation
    _onEventRemove: function (s, recs) {
        this.onEventRemove.apply(this, arguments);
    },
      
    bindEventStore : function(eventStore, initial) {
        var me = this;

        if (!initial && me.eventStore) {
            if (eventStore !== me.eventStore && me.eventStore.autoDestroy) {
                me.eventStore.destroy();
            } 
            else {
                me.mun(me.eventStore, {
                    scope: me,
                    datachanged: me.onDataChanged,
                    add: me._onEventAdd,
                    remove: me._onEventRemove,
                    update: me._onEventUpdate,
                    clear: me.refresh
                });
            }
            if (!eventStore) {
                if (me.loadMask) {
                    me.loadMask.bindStore(null);
                }
                me.eventStore = null;
            }
        }
        if (eventStore) {
            eventStore = Ext.data.StoreManager.lookup(eventStore);
            me.mon(eventStore, {
                scope: me,
                datachanged: me.onDataChanged,
                add: me._onEventAdd,
                remove: me._onEventRemove,
                update: me._onEventUpdate,
                clear: me.refresh
            });
            if (me.loadMask) {
                me.loadMask.bindStore(eventStore);
            }
        }
        
        me.eventStore = eventStore;

        if (eventStore && !initial) {
            me.refresh();
        }
    },

   

    afterHeaderResized : function() {
        var resizer = this.headerCt.resizer;
            
        if (resizer && resizer.dragHd instanceof Sch.column.Resource) {
            var w = resizer.dragHd.getWidth();
            this.setColumnWidth(w);
        }
    },

        
        // invoked by the selection model to maintain visual UI cues
    onEventSelect: function(record) {
        var node = this.getEventNodeByRecord(record);
        if (node) {
            Ext.fly(node).addCls(this.selectedEventCls);
        }
    },

    // invoked by the selection model to maintain visual UI cues
    onEventDeselect: function(record) {
        var node = this.getEventNodeByRecord(record);
        if (node) {
            Ext.fly(node).removeCls(this.selectedEventCls);
        }
    }
});

/**

@class Sch.view.SchedulerGridView
@extends Sch.view.TimelineGridView
@mixin Sch.mixin.SchedulerView

Desc

*/
Ext.define("Sch.view.SchedulerGridView", {
    extend              : 'Sch.view.TimelineGridView',
    mixins              : ['Sch.mixin.SchedulerView'],
    alias               : 'widget.schedulergridview',
    alternateClassName  : 'Sch.HorizontalSchedulerView'
}, function() {
    this.override(Sch.mixin.SchedulerView.prototype.inheritables() || {});
});
   

/**

@class Sch.mixin.TimelinePanel

A base mixing for {@link Ext.panel.Panel} classes, giving to the consuming panel the "time line" functionality. 
This means that the panel will be capabale to display a list of "events", ordered on the {@link Sch.data.TimeAxis time axis}.

Generally, should not be used directly, if you need to subclass the scheduler panel, subclass the {@link Sch.panel.SchedulerGrid} or {@link Sch.panel.SchedulerTree} 
instead.

*/

Ext.define('Sch.mixin.TimelinePanel', {
    requires: [
        'Sch.util.Patch',
        'Sch.patches.CellEditing',
        'Sch.patches.Editing',
        'Sch.patches.LoadMask',
        'Sch.patches.Model',
        'Sch.patches.NodeInterface',
        'Sch.patches.Operation',
        'Sch.patches.TablePanel',
        'Sch.patches.TreePanel',
        'Sch.patches.TreeStore',
        'Sch.patches.TreeStoreIE',
        'Sch.patches.TreeView',
        'Sch.patches.XmlReader',

        'Sch.data.TimeAxis',
        'Sch.feature.Scheduling',
        'Sch.view.Locking',
        'Sch.mixin.Lockable',
        'Sch.preset.Manager'
    ],


    /**
    * @cfg {String} orientation An initial orientation of the view - can be either `horizontal` or `vertical`. Default value is `horizontal`.
    */
    orientation: 'horizontal',

    /**
    * @cfg {Int} weekStartDay A valid JS date index between 0-6. (0: Sunday, 1: Monday etc.)
    */
    weekStartDay: 1,

    /**
    * @cfg {Boolean} snapToIncrement true to snap to resolution increment while interacting with scheduled events.
    */
    snapToIncrement: false,

    /**
    * @cfg {Boolean} readOnly true to disable editing.
    */
    readOnly: false,

    /**
    * @cfg {String} eventResizeHandles Defines which resize handles to use for resizing events. Possible values: 'none', 'start', 'end', 'both'. Defaults to 'both'
    */
    eventResizeHandles: 'both',

    /**
    * @cfg {Int} rowHeight The row height (used in horizontal mode only)
    */

    /**
    * @cfg {Object} validatorFnScope
    * The scope used for the different validator functions.
    */

    /**
    * @cfg {String} viewPreset A key used to lookup a predefined {@link Sch.preset.ViewPreset} (e.g. 'weekAndDay', 'hourAndDay'), managed by {@link Sch.preset.Manager}. See Sch.preset.Manager for more information.
    */
    viewPreset: 'weekAndDay',

    /**
    * @property {String} viewPreset A name of the current view preset: {@link Sch.ViewPreset}. Required.
    */


    /**
    * @cfg {Date} startDate A start date of the timeline. Required
    */
    startDate: null,

    /**
    * @cfg {Date} endDate A end date of the timeline. Required
    */
    endDate: null,


    // The width of the left + right border of your event, needed to calculate the correct start/end positions
    eventBorderWidth: 1,

    // TODO, remove for 2.1. Don't think we need this
    syncCellHeight: Ext.emptyFn,

    /**
    * @cfg {Object} lockedGridConfig A custom config object used to initialize the left (locked) grid panel.
    */

    /**
    * @cfg {Object} schedulerConfig A custom config object used to initialize the right (schedule) grid panel. 
    */

    /**
    * @cfg {Ext.Template} tooltipTpl 
    * Template used to show a tooltip over a scheduled item, null by default (meaning no tooltip). The tooltip will be populated with the data in 
    * record corresponding to the hovered element. See also {@link #tipCfg}.
    */
    tooltipTpl: null,

    /**
    * @cfg {Object} tipCfg
    * The {@link Ext.Tooltip} config object used to configure a tooltip (only applicable if tooltipTpl is set).
    */
    tipCfg: {
        cls: 'sch-tip',

        showDelay: 1000,
        hideDelay: 0,

        autoHide: true,
        anchor: 'b'
    },

   
    inheritables: function() {
        return {
            // Configuring underlying table panel
            lockable: true,
            columnLines: true,
            enableColumnMove: false,
            // EOF: Configuring underlying table panel

            lockedXType: null,
            normalXType: null,

            // private
            initComponent: function () {

                this.addEvents(

                /** 
                * @event timeheaderdblclick
                * Fires after a doubleclick on a time header cell
                * @param {Sch.column.Time} column The column object
                * @param {Date} startDate The start date of the header cell
                * @param {Date} endDate The start date of the header cell
                * @param {Ext.EventObject} e The event object
                */
                    'timeheaderdblclick',

                /**
                * @event beforeviewchange
                * Fires before the current view changes to a new view type or a new time span. Return false to abort this action.
                * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                * @param {Object} preset The new preset
                */
                    'beforeviewchange',

                /**
                * @event viewchange
                * Fires after current view preset or time span has changed
                * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                */
                    'viewchange'
                );

                if (!this.timeAxis) {
                    this.timeAxis = Ext.create("Sch.data.TimeAxis");
                }

                if (!this.columns && !this.colModel) {
                    // No columns specified at all, fall back to empty array
                    this.columns = [];
                }

                if (this.lockable) {
                    this.self.mixin('lockable', Sch.mixin.Lockable);
                    var i = 0,
                        len = this.columns.length,
                        column;

                    for (; i < len; ++i) {
                        column = this.columns[i];
                        if (column.locked !== false) {
                            column.locked = true;
                        }
                    }
                    this.timeAxis.on('reconfigure', this.onTimeAxisReconfigure, this);
                    this.switchViewPreset(this.viewPreset, this.startDate, this.endDate, true);
                }

                this.callParent(arguments);

                // HACK - too early to call 'applyViewSettings' in the 'switchViewPreset' before calling parent's `initComponent` - requires a view presence
                if (this.lockable) {
                    this.applyViewSettings(this.timeAxis.preset);
                    if (!this.viewPreset) {
                        throw 'You must define a valid view preset object. See Sch.preset.Manager class for reference';
                    }
                }

                this.relayEvents(this.getView(), [
                /**
                * @event beforetooltipshow
                * Fires before the event tooltip is shown, return false to suppress it.
                * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                * @param {Ext.data.Model} eventRecord The event record of the clicked record
                */
                    'beforetooltipshow',

                /**
                * @event scheduleclick
                * Fires after a click on the schedule area
                * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                * @param {Date} clickedDate The clicked date 
                * @param {Int} rowIndex The row index 
                * @param {Ext.EventObject} e The event object
                */
                    'scheduleclick',

                /**
                * @event scheduledblclick
                * Fires after a doubleclick on the schedule area
                * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                * @param {Date} clickedDate The clicked date 
                * @param {Int} rowIndex The row index 
                * @param {Ext.EventObject} e The event object
                */
                    'scheduledblclick',

                /**
                * @event schedulecontextmenu
                * Fires after a context menu click on the schedule area
                * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
                * @param {Date} clickedDate The clicked date 
                * @param {Int} rowIndex The row index 
                * @param {Ext.EventObject} e The event object
                */
                    'schedulecontextmenu'
                ]);
            },

            initStateEvents: function () {
                this.stateEvents.push('viewchange');
                this.callParent();
            },

            getState: function () {
                var me = this,
                    state = me.callParent(arguments);

                Ext.apply(state, {
                    viewPreset: me.viewPreset,
                    startDate: me.getStart(),
                    endDate: me.getEnd()
                });
                return state;
            },

            applyState: function (state) {
                var me = this;
                me.callParent(arguments);

                if (state && state.viewPreset) {
                    me.switchViewPreset(state.viewPreset, state.startDate, state.endDate);
                }
            },

            afterRender: function () {
                this.callParent(arguments);

                if (this.lockable) {
                    this.el.addCls('sch-' + this.orientation);
                } else {
                    var header = this.headerCt;

                    if (header && header.reorderer && header.reorderer.dropZone) {
                        var dz = header.reorderer.dropZone;
                        dz.positionIndicator = Ext.Function.createSequence(dz.positionIndicator, function () {
                            this.valid = false;
                        });
                    }
                }
            }
        };
    },

    /**
    * The {@link #readOnly} accessor. Use it to switch the `readonly` state. 
    */
    setReadOnly: function (readOnly) {
        this.getSchedulingView().setReadOnly(readOnly);
    },

    /**
    * Switches the current header preset. See the {@link Sch.preset.Manager} for details. Will fire the {@link #beforeviewchange} event.
    * Returning `false` from the listener will cancel the switch. 
    * 
    * @param {String} preset The name of the new preset
    * @param {Date} startDate (optional) A new start date for the time axis
    * @param {Date} endDate (optional) A new end date for the time axis
    */
    switchViewPreset: function (preset, startDate, endDate, initial) {
        if (this.fireEvent('beforeviewchange', this, preset, startDate, endDate) !== false) {
            if (Ext.isString(preset)) {
                this.viewPreset = preset;
                preset = Sch.preset.Manager.getPreset(preset);
            }

            if (!preset) {
                throw 'View preset not found';
            }

            var hConf = preset.headerConfig;

            var timeAxisCfg = {
                unit: hConf.bottom ? hConf.bottom.unit : hConf.middle.unit,
                increment: (hConf.bottom ? hConf.bottom.increment : hConf.middle.increment) || 1,
                resolutionUnit: preset.timeResolution.unit,
                resolutionIncrement: preset.timeResolution.increment,

                weekStartDay: this.weekStartDay,

                mainUnit: hConf.middle.unit,
                shiftUnit: preset.shiftUnit,

                headerConfig: preset.headerConfig,
                shiftIncrement: preset.shiftIncrement || 1,
                preset: preset,
                defaultSpan: preset.defaultSpan || 1
            };

            if (initial) {
                timeAxisCfg.start = startDate || new Date();
                timeAxisCfg.end = endDate;

            } else {
                timeAxisCfg.start = startDate || this.timeAxis.getStart();
                timeAxisCfg.end = endDate;
            }

            // HACK - need to adjust the height of headers after the preset change
            var normalGrid = this.normalGrid;

            if (normalGrid && normalGrid.headerCt && Ext.versions.extjs.isGreaterThan("4.0.5")) {

                normalGrid.headerCt.on('afterlayout', function () {
                    var lockedHeaderCt = this.lockedGrid.headerCt;
                    var normalHeaderCt = normalGrid.headerCt;

                    lockedHeaderCt.setSize(lockedHeaderCt.getWidth(), normalHeaderCt.getHeight());
                }, this, { single: true });
            }
            // EOF HACK

            // Apply view specific properties to the view
            if (!initial) {
                this.applyViewSettings(preset); // Subclass may decide which property from the preset to use (orientation specific)
            }
            this.timeAxis.reconfigure(timeAxisCfg);
        }
    },

    // Applies view specific settings from the preset about to be used
    applyViewSettings: function (preset) {
        var view = this.getSchedulingView();

        view.setDisplayDateFormat(preset.displayDateFormat);

        if (this.orientation === 'horizontal') {
            view.setRowHeight(this.rowHeight || preset.rowHeight, true);
        }
    },

    /**
    * Method to get a the current start date of the scheduler view
    * @return {Date} The start date
    */
    getStart: function () {
        return this.timeAxis.getStart();
    },

    /**
    * Method to get a the current end date of the scheduler view
    * @return {Date} The end date
    */
    getEnd: function () {
        return this.timeAxis.getEnd();
    },

    /**
    * Updates the widths of all time columns to the supplied value. Only applicable when forceFit is set to false on the view.
    * @param {Int} width The new time column width
    */
    setTimeColumnWidth: function (width, preventRefresh) {
        this.getSchedulingView().setColumnWidth(width, preventRefresh);
    },

    // private
    onTimeAxisReconfigure: function () {
        this.fireEvent('viewchange', this);
    },

    /**
    * Moves the time axis forward in time in units specified by the view preset 'shiftUnit', and by the amount specified by the parameter or by the shiftIncrement config of the current view preset.
    * @param {Int} amount (optional) The number of units to jump forward
    */
    shiftNext: function (amount) {
        this.timeAxis.shiftNext(amount);
    },

    /**
    * Moves the time axis backward in time in units specified by the view preset 'shiftUnit', and by the amount specified by the parameter or by the shiftIncrement config of the current view preset.
    * @param {Int} amount (optional) The number of units to jump backward
    */
    shiftPrevious: function (amount) {
        this.timeAxis.shiftPrevious(amount);
    },

    /**
    * Convenience method to go to current date.
    */
    goToNow: function () {
        this.setTimeSpan(new Date());
    },

    /**
    * Changes the time axis timespan to the supplied start and end dates.
    * @param {Date} start The new start date
    * @param {Date} end (Optional) The new end date. If not supplied, the {@link Sch.preset.ViewPreset#defaultSpan} property of the current view preset will be used to calculate the new end date.
    */
    setTimeSpan: function (start, end) {
        if (this.timeAxis) {
            this.timeAxis.setTimeSpan(start, end);
        }
    },

    /**
    * Changes the time axis start date to the supplied date.
    * @param {Date} amount The new start date
    */
    setStart: function (date) {
        this.setTimeSpan(date);
    },

    /**
    * Changes the time end start date to the supplied date.
    * @param {Date} amount The new end date
    */
    setEnd: function (date) {
        this.setTimeSpan(null, date);
    },

    /**
    * Returns the {@link Sch.data.TimeAxis} instance in use.
    */
    getTimeAxis: function () {
        return this.timeAxis;
    },

    // DEPRECATED
    getResourceByEventRecord: function (eventRecord) {
        return eventRecord.getResource();
    },


    /**
    * Scrolls the time line to the specified `date`. Can only be used in horizontal orientation
    * @param {Date} date The date to which to scroll the time line
    */
    scrollToDate: function (date) {
        var x = this.getSchedulingView().getXYFromDate(date, true)[0];
        if (x >= 0) {
            var scroller = this.getHorizontalScroller();
            scroller.setScrollLeft(x);
        }
    },


    /**
    * Returns the view of the scheduler part with time columns. This method should be used instead of usual `getView`, 
    * because `getView` will return an instance of special "locking" view, which has no any scheduler-specific features.
    * 
    * @return {Sch.mixin.SchedulerView} view A view implementing the {@link Sch.mixin.SchedulerView} mixin
    */
    getSchedulingView: function () {
        return this.lockable ? this.normalGrid.getView() : this.getView();
    },

    /**
    * @cfg {Function} timeCellRenderer An empty function by default, but provided so that you can manipulate the html cells that make up the schedule.
    * This is called once for each cell, just like a normal GridPanel renderer though returning values from it has no effect.
    * @param {Object} meta The same meta object as seen in a standard GridPanel cell renderer. Use it to modify CSS/style of the cell.
    * @param {Ext.data.Model} record The resource record to which the cell belongs
    * @param {Int} row The row index
    * @param {Int} col The col index
    * @param {Ext.data.Store} ds The resource store
    * @param {Date} startDate The start date of the cell
    * @param {Date} endDate The end date of the cell
    */
    timeCellRenderer: Ext.emptyFn,

    /**
    * @cfg {Object} timeCellRendererScope The scope to use for the `timeCellRenderer` function 
    */
    timeCellRendererScope: null,

    setOrientation: function (orientation) {
        this.el.removeCls('sch-' + this.orientation);
        this.el.addCls('sch-' + orientation);

        this.orientation = orientation;
    }
});
/**

@class Sch.mixin.SchedulerPanel
A mixin for {@link Ext.panel.Panel} classes, providing "scheduling" functionality to the consuming panel. 
A consuming class should have already consumed the {@link Sch.mixin.TimelinePanel} mixin.

Generally, should not be used directly, if you need to subclass the scheduler panel, subclass the {@link Sch.panel.SchedulerGrid} or {@link Sch.panel.SchedulerTree} 
instead.

*/

Ext.define('Sch.mixin.SchedulerPanel', {
    requires: [
        'Sch.view.SchedulerGridView',
        'Sch.model.Event',
        'Sch.model.Resource',
        'Sch.selection.EventModel',
        'Sch.util.Date',

        'Sch.column.timeAxis.Vertical'
    ],

    // TODO DOCUMENT
    resourceColumnWidth: null,

    /**
    * @cfg {String} eventBarIconClsField
    * A field in the Event model whose value will be applied as a CSS class to each event bar to place a 16x16 icon.
    */
    eventBarIconClsField    : '',

    /**
    * @cfg {String} eventSelModelType The xtype of the selection model to be used to events. Should be a {@link Sch.selection.EventModel} or its subclass.
    */
    eventSelModelType: 'eventmodel',

    /**
    * @cfg {Object} eventSelModel The configuration object for the event selection model. See {@link Sch.selection.EventModel} for available configuration options.
    */
    eventSelModel: null,

    /**
    * @cfg {Boolean} enableEventDragDrop true to enable drag and drop of events, defaults to true
    */
    enableEventDragDrop: true,

    /**
    * @cfg {Boolean} enableDragCreation true to enable creating new events by click and drag, defaults to true
    */
    enableDragCreation: true,

    /**
    * @cfg {String} eventBarTextField The field in your data model that will be rendered into each event bar. 
    * You can alternatively use the eventBarRenderer to get full control over what gets displayed.
    */
    eventBarTextField: 'Name',

    /**
    * @cfg {Boolean} allowOverlap Set to false if you don't want to allow events overlapping (defaults to true).
    */
    allowOverlap: true,

    /**
    * @cfg {String} startParamName The name of the start date parameter that will be passed to in every `eventStore` load request.
    */
    startParamName: 'startDate',

    /**
    * @cfg {String} endParamName The name of the end date parameter that will be passed to in every `eventStore` load request.
    */
    endParamName: 'endDate',

    /**
    * @cfg {Boolean} passStartEndParameters true to apply start and end dates of the current view to any `eventStore` load requests.
    */
    passStartEndParameters: false,

    /**
    * @cfg {Function} eventRenderer
    * An empty function by default, but provided so that you can override it. This function is called each time an event 
    * is rendered into the schedule to render the contents of the event. 
    * By default, the eventTpl includes placeholders for 'cls', 'style', and 'text'. The cls property is a CSS class which will be added to the 
    * event element. The style property is an inline style declaration for the event element. 
    * The text property will be rendered inside the bar. If you override the default eventTpl, you can of course 
    * include other placeholder in your template markup. Note: You will still need to keep the original built-in placeholders for the scheduler to work. 
    *
    * <pre>
    *  eventRenderer : function (eventRec, resourceRec, templateData) {
    *      templateData.style = 'color:white';                 // You can use inline styles too.
    *      templateData.cls = resourceRec.get('Category');     // Read a property from the resource record, used as a CSS class to style the event
    *      return Ext.Date.format(eventRec.getStartDate(), 'Y-m-d') + ': ' + eventRec.get('Name');
    *  }
    *</pre>
    * @param {Ext.data.Model} eventRecord The event about to be rendered
    * @param {Ext.data.Model} resourceRecord The resource row in which the event is being created
    * @param {Object} tplData An object that will be applied to the containing {@link #eventTpl}.
    * @param {Int} row The row index
    * @param {Int} col The column index
    * @param {Ext.data.Store} ds The resource store
    * @return {String/Object} A simple string, or a custom object which will be applied to the {@link #eventBodyTemplate}, creating the actual HTML
    */
    eventRenderer: null,

    /**
    * @cfg {Ext.data.Store} eventStore The {@link Ext.data.Store} holding the events to be rendered into the scheduler (required).
    */
    eventStore: null,

    /**
    * @cfg {Ext.data.Store} resourceStore The {@link Ext.data.Store} holding the resources to be rendered into the scheduler (required).
    */
    resourceStore: null,


    /**
    * @cfg {Ext.Template} eventTpl The wrapping template used to renderer your events in the scheduler. Normally you should now override this,
    * only do so if you need total control of how the events are rendered/styled. See the {@link eventBodyTemplate} for more information. 
    */
    eventTpl: null,

    /**
    * @cfg {Ext.Template} eventBodyTemplate The template used to generate the markup of your events in the scheduler. To 'populate' the eventBodyTemplate with data, use the {@link eventRenderer} method 
    */
    eventBodyTemplate: null,

    /**
    *  @cfg {Object} timeAxisColumnCfg A {@link Ext.grid.column.Column} config used to configure the time axis column in vertical orientation.
    */

    /**
    *  @cfg {Object} createConfig Custom config to pass to the {@link Sch.feature.DragCreator} instance
    *  @cfg {Object} resizeConfig Custom config to pass to the {@link Sch.Resize} instance
    *  @cfg {Object} dragConfig Custom config to pass to the {@link Sch.SchedulerDragZone} instance
    *  @cfg {Object} dropConfig Custom config to pass to the {@link Sch.SchedulerDropZone} instance
    */

    componentCls: 'sch-schedulerpanel',

    /**
    * @cfg {Boolean} lockedGridDependsOnSchedule set this to true if you require the left (locked) grid section to be refreshed when the schedule is updated.
    */
    lockedGridDependsOnSchedule: false,

    /**
    * @method dndValidatorFn
    * An empty function by default, but provided so that you can perform custom validation on 
    * the item being dragged. This function is called during a drag and drop process and also after the drop is made
    * @param {Array} dragRecords an array containing the records for the events being dragged
    * @param {Ext.data.Model} targetResourceRecord the target resource of the the event 
    * @param {Date} date The date corresponding to the drag proxy position
    * @param {Int} duration The duration of the item being dragged in milliseconds
    * @param {Event} e The event object
    * @return {Boolean} true if the drop position is valid, else false to prevent a drop
    */

    /**
    * @method resizeValidatorFn
    * An empty function by default, but provided so that you can perform custom validation on 
    * an item being resized.
    * @param {Ext.data.Model} resourceRecord the resource of the row in which the event is located
    * @param {Ext.data.Model} eventRecord the event being resized
    * @param {Date} startDate
    * @param {Date} endDate
    * @param {Event} e The event object
    * @return {Boolean} true if the resize state is valid, else false
    */

    /**
    * @method createValidatorFn
    * An empty function by default, but provided so that you can perform custom validation on the item being created
    * @param {Ext.data.Model} resourceRecord the resource for which the event is being created
    * @param {Date} startDate
    * @param {Date} endDate
    * @param {Event} e The event object
    * @return {Boolean} true if the creation event is valid, else false
    */

    inheritables : function() {
        return {
            // private
            initComponent: function () {
                var resourceStore = this.resourceStore;

                if (!resourceStore) {
                    Ext.Error.raise("You must specify a resourceStore config");
                }

                if (!this.eventStore) {
                    Ext.Error.raise("You must specify an eventStore config");
                }

                this.eventStore = Ext.StoreManager.lookup(this.eventStore);
                this.resourceStore = Ext.StoreManager.lookup(resourceStore);

                Ext.applyIf(this, {
                    store: resourceStore,          // For the grid panel API
                    resourceStore: resourceStore
                });

                this.resourceStore.eventStore = this.eventStore;
                this.eventStore.resourceStore = this.resourceStore;

                if (this.lockable && this.passStartEndParameters) {
                    this.eventStore.on('beforeload', this.applyStartEndParameters, this);
                }

                this.callParent(arguments);

                if (!this.lockable && (this.resourceStore instanceof Ext.data.TreeStore)) {
                    this.getView().store.eventStore = this.eventStore;
                }

                // Relaying after parent class has setup the locking grid components
                this.relayEvents(this.getView(), [
                /**
                * @event eventclick
                * Fires when an event is clicked
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} eventRecord The event record of the clicked event
                * @param {Ext.EventObject} e The event object
                */
                    'eventclick',

                /**
                * @event eventdblclick
                * Fires when an event is double clicked
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} eventRecord The event record of the clicked event
                * @param {Ext.EventObject} e The event object
                */
                    'eventdblclick',

                /**
                * @event eventcontextmenu
                * Fires when contextmenu is activated on an event
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} eventRecord The event record of the clicked event
                * @param {Ext.EventObject} e The event object
                */
                    'eventcontextmenu',

                // Resizing events start --------------------------
                /**
                * @event beforeeventresize
                * Fires before a resize starts, return false to stop the execution
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} record The record about to be resized
                * @param {Ext.EventObject} e The event object
                */
                    'beforeeventresize',

                /**
                * @event eventresizestart
                * Fires when resize starts
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} record The event record being resized
                */
                    'eventresizestart',

                /**
                * @event eventpartialresize
                * Fires during a resize operation and provides information about the current start and end of the resized event
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} record The event record being resized
                * @param {Date} startDate The new start date of the event
                * @param {Date} endDate The new end date of the event
                * @param {Ext.Element} element The proxy element being resized
                */
                    'eventpartialresize',

                /**
                * @event eventresizeend
                * Fires after a succesful resize operation
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} record The updated event record
                */
                    'eventresizeend',
                // Resizing events end --------------------------

                // Dnd events start --------------------------
                /**
                * @event beforeeventdrag
                * Fires before a dnd operation is initiated, return false to cancel it
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} record The record corresponding to the node that's about to be dragged
                * @param {Ext.EventObject} e The event object
                */
                    'beforeeventdrag',

                /**
                * @event eventdragstart
                * Fires when a dnd operation starts
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Array} records the records being dragged
                */
                    'eventdragstart',

                /**
                * @event eventdrop
                * Fires after a succesful drag and drop operation
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {[Sch.model.Event]} records the affected records (if copies were made, they were not inserted into the store)
                * @param {Boolean} isCopy True if the records were copied instead of moved
                */
                    'eventdrop',

                /**
                * @event aftereventdrop
                * Fires when after a drag n drop operation, even when drop was performed on an invalid location
                * @param {SchedulerPanel} scheduler The scheduler object
                */
                    'aftereventdrop',
                // Dnd events end --------------------------

                // Drag create events start --------------------------
                /**
                * @event beforedragcreate
                * Fires before a drag starts, return false to stop the execution
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Resource} resource The resource record
                * @param {Ext.EventObject} e The event object
                */
                    'beforedragcreate',

                /**
                * @event dragcreatestart
                * Fires before a drag starts, return false to stop the execution
                * @param {SchedulerPanel} scheduler The scheduler object
                */
                    'dragcreatestart',

                /**
                * @event dragcreateend
                * Fires after a successful drag-create operation
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} newEventRecord The newly created event record (added to the store in onEventCreated method)
                * @param {Sch.model.Resource} resource The resource record to which the event belongs
                * @param {Ext.EventObject} e The event object
                */
                    'dragcreateend',

                /**
                * @event afterdragcreate
                * Always fires after a drag-create operation
                * @param {SchedulerPanel} scheduler The scheduler object
                */
                    'afterdragcreate',
                // Drag create events end --------------------------

                /**
                * @event beforeeventadd
                * Fires after a successful drag-create operation, before the new event is added to the store. Return false to prevent the event from being added to the store.
                * @param {SchedulerPanel} scheduler The scheduler object
                * @param {Sch.model.Event} newEventRecord The newly created event record 
                */
                    'beforeeventadd'
                ]);
            },

            /**
            * Switch the orientation of this panel
            * 
            * @param {String} orientation Either "horizontal" or "vertical"
            */
            setOrientation: function (orientation, force) {
                if (orientation === this.orientation && !force) {
                    return;
                }

                this.callParent(arguments);

                var normalGrid = this.normalGrid,
                    lockedGrid = this.lockedGrid,
                    me = this,
                    schedulingView = this.getSchedulingView(),
                    normalHeaderCt = normalGrid.headerCt;

                schedulingView.setOrientation(orientation);

                normalHeaderCt.suspendLayout = true;
                normalHeaderCt.items.each(function (col) {
                    normalHeaderCt.remove(col);
                });
                normalHeaderCt.suspendLayout = false;

                if (orientation === 'horizontal') {
                    var columns = me.processColumns(me.columns);

                    this.resourceStore.un({
                        clear: this.refreshResourceColumns,
                        datachanged: this.refreshResourceColumns,
                        load: this.refreshResourceColumns,

                        scope: this
                    });

                    var timeAxisCol = Ext.create("Sch.column.timeAxis.Horizontal", {
                        timeAxis: me.timeAxis,
                        timeCellRenderer: me.timeCellRenderer,
                        timeCellRendererScope: me.timeCellRendererScope,

                        listeners: {
                            // HACK
                            timeaxiscolumnreconfigured: schedulingView.checkHorizontalFit,
                            scope: schedulingView
                        }
                    });

                    normalGrid.getView().suspendEvents();
                    lockedGrid.getView().suspendEvents();

                    schedulingView.setRowHeight(this.rowHeight || this.timeAxis.preset.rowHeight, true);

                    schedulingView.suppressFitCheck++;
                    lockedGrid.reconfigure(this.resourceStore, columns.locked);
                    normalGrid.reconfigure(this.resourceStore, [timeAxisCol].concat(columns.right));
                    schedulingView.suppressFitCheck--;

                    lockedGrid.getView().resumeEvents();
                    normalGrid.getView().resumeEvents();

                    schedulingView.setColumnWidth(this.timeAxis.preset.timeColumnWidth || 60, true);
                } else {

                    schedulingView.setRowHeight(this.timeAxis.preset.timeColumnWidth || 60, true);
                    schedulingView.setColumnWidth(this.timeAxis.preset.resourceColumnWidth || 100, true);

                    this.resourceStore.on({
                        clear: this.refreshResourceColumns,
                        datachanged: this.refreshResourceColumns,
                        load: this.refreshResourceColumns,

                        scope: this
                    });
                    lockedGrid.reconfigure(this.timeAxis.tickStore, [
                        Ext.create('Sch.column.timeAxis.Vertical', Ext.apply({
                            width: 100,
                            timeAxis: me.timeAxis,
                            locked: true
                        }, this.timeAxisColumnCfg || {}))
                    ]);
                    normalGrid.reconfigure(this.timeAxis.tickStore, this.createResourceColumns());
                    lockedGrid.doComponentLayout();
                }

                normalGrid.view.refresh();
            },

            applyViewSettings: function (preset) {
                this.callParent(arguments);

                var v = this.getSchedulingView(),
                    height;

                if (this.orientation === 'horizontal') {
                    height = this.rowHeight = this.rowHeight || preset.rowHeight;
                } else {
                    // timeColumnWidth is used for row height in vertical mode
                    // though user can still supply a value when configuring the panel that overrides the view preset value
                    height = this.timeColumnWidth = this.timeColumnWidth || preset.timeColumnWidth || 60;
                    v.setColumnWidth(preset.resourceColumnWidth || 100, true);
                }

                v.setRowHeight(height, true);
            },

        
            // Needed to properly initialize vertical view upon first rendering
            afterRender: function () {
                this.callParent(arguments);
                if (this.lockable) {
                    if (this.lockedGridDependsOnSchedule) {
                        this.normalGrid.getView().on('refresh', this.onNormalViewRefresh, this);
                    }
                }
            }
        };
    },

    /**
    * Returns the resource store instance
    * @return {Ext.data.Store} 
    */
    getResourceStore: function () {
        return this.resourceStore;
    },


    /**
    * Returns the event store instance
    * @return {Ext.data.Store} 
    */
    getEventStore: function () {
        return this.eventStore;
    },

    /**
    * Returns the selection model being used, and creates it via the configuration
    * if it has not been created already.
    * @return {Ext.selection.Model} selModel
    */
    getEventSelectionModel: function () {
        // already has the event selection model
        if (this.eventSelModel && this.eventSelModel.events) {
            return this.eventSelModel;
        }

        if (!this.eventSelModel) {
            this.eventSelModel = {};
        }

        var eventSelModel = this.eventSelModel;

        var mode = 'SINGLE';

        if (this.simpleSelect) {
            mode = 'SIMPLE';
        } else if (this.multiSelect) {
            mode = 'MULTI';
        }

        Ext.applyIf(eventSelModel, {
            allowDeselect: this.allowDeselect,
            mode: mode
        });

        if (!eventSelModel.events) {
            eventSelModel = this.eventSelModel = Ext.create('selection.' + this.eventSelModelType, eventSelModel);
        }

        if (!eventSelModel.hasRelaySetup) {
            this.relayEvents(eventSelModel, [
            /**
            * @event
            * Fired after a selection change has occurred
            * @param {Sch.selection.EventModel} this
            * @param {[Sch.model.Event]} selected The selected events
            */
                'selectionchange',

            /**
            * @event deselect
            * Fired after a record is deselected
            * @param {Sch.selection.EventModel} this
            * @param  {Sch.model.Event} record The deselected event
            */
                'deselect',

            /**
            * @event select
            * Fired after a record is selected
            * @param {Sch.selection.EventModel} this
            * @param  {Sch.model.Event} record The selected event
            */
                'select'
            ]);
            eventSelModel.hasRelaySetup = true;
        }

        // lock the selection model if user
        // has disabled selection
        if (this.disableSelection) {
            eventSelModel.locked = true;
        }

        return eventSelModel;
    },



    applyStartEndParameters: function (eventStore, options) {
        options.params = options.params || {};

        options.params[this.startParamName] = this.getStart();
        options.params[this.endParamName] = this.getEnd();
    },


    

    refreshResourceColumns: function () {
        var headerCt = this.normalGrid.headerCt;

        if (headerCt.getColumnCount() > 0) {
            headerCt.removeAll();
        }

        headerCt.add(this.createResourceColumns());
        this.getView().refresh();
    },


    createResourceColumns: function () {
        var newItems = [],
            view = this.getSchedulingView();

        var me = this;

        this.resourceStore.each(function (resource) {

            newItems.push(Ext.create("Sch.column.Resource", {
                tdCls: view.timeCellCls,
                renderer: view.timeColumnRenderer,
                scope: view,

                width: me.resourceColumnWidth || me.timeAxis.preset.resourceColumnWidth || 100,
                text: resource.getName()
            }));
        });

        return newItems;
    },


    onNormalViewRefresh: function () {
        if (this.normalGrid.getView().getOrientation() === 'horizontal') {
            this.lockedGrid.getView().refresh();

            // Row heights must be re-synced
            this.onNormalGridAfterRefresh();
        }
    }
});


/**

@class Sch.view.TimelineTreeView
@extends Ext.tree.View
@mixin Sch.mixin.TimelineView

A tree view class, that have consumed the {@link Sch.mixin.TimelineView} mixin. Used internally.

*/
Ext.define("Sch.view.TimelineTreeView", {
    extend          : "Ext.tree.View",
    mixins : [
        'Sch.mixin.TimelineView'
    ], 
    
    inheritables : {
        resetScrollersTimeoutId        : null,
        
        cellBorderWidth : 0,

        afterRender : function() {
            this.el.addCls('sch-timelinetreeview');
            this.callParent(arguments);
        },
        
        resetScrollers: function (immediate) {
            if (!this.el || !this.el.dom) {
                return;
            }

            if (immediate) {
                return this.callParent([]);
            }
            
            if (this.resetScrollersTimeoutId) {
                clearTimeout(this.resetScrollersTimeoutId);
            }
            
            var me      = this;
            
            this.resetScrollersTimeoutId = setTimeout(function () {
                delete me.resetScrollersTimeoutId;
                
                me.resetScrollers(true);
            }, 0);
        }
    }
}, function() {
    this.override(Sch.mixin.TimelineView.prototype.inheritables() || {});
});
/**

@class Sch.view.SchedulerTreeView
@extends Sch.view.TimelineTreeView
@mixin Sch.mixin.SchedulerView

Desc

*/
Ext.define('Sch.view.SchedulerTreeView', {
    extend  : 'Sch.view.TimelineTreeView',
    alias   : 'widget.schedulertreeview',
    mixins : ['Sch.mixin.SchedulerView']
}, function() {
    this.override(Sch.mixin.SchedulerView.prototype.inheritables() || {});
});
/**

@class Sch.panel.TimelineGridPanel
@extends Ext.grid.Panel
@mixin Sch.mixin.TimelinePanel

Internal class. 

*/
Ext.define("Sch.panel.TimelineGridPanel", {
    extend  : "Ext.grid.Panel",
    mixins  : ['Sch.mixin.TimelinePanel']
}, function() {
    this.override(Sch.mixin.TimelinePanel.prototype.inheritables() || {});
});
/**

@class Sch.panel.TimelineTreePanel
@extends Ext.tree.Panel
@mixin Sch.mixin.TimelinePanel

Internal class.

*/
Ext.define("Sch.panel.TimelineTreePanel", {
    extend      : "Ext.tree.Panel",
    requires    : ['Ext.data.TreeStore'], 
    mixins      : ['Sch.mixin.TimelinePanel'],
    
    useArrows       : true,
        
    // TODO add test for this
    // Bug in Ext JS: http://www.sencha.com/forum/showthread.php?136398-4.0.2-RC3-rootVisible-set-to-true-on-TreeGrid-example-shows-nothing&p=611999#post611999
    rootVisible     : false,

    // TODO add test for this
    initComponent : function() {
        this.callParent(arguments);

        if (this.lockable && this.lockedGrid.headerCt.query('treecolumn').length === 0) {
            Ext.Error.raise("You must define an Ext.tree.Column (or use xtype : 'treecolumn').");
        }
    }
}, function() { 
    this.override(Sch.mixin.TimelinePanel.prototype.inheritables() || {});
});
/** 

@class Sch.panel.SchedulerGrid
@extends Sch.panel.TimelineGridPanel
@mixin Sch.mixin.SchedulerPanel

@alternateClassName Sch.SchedulerPanel

A scheduler panel based on the {@link Ext.grid.Panel} class which allows you to visualize and manage "resources" and their scheduled "events".

Please refer to <a href="#!/guide/scheduler_getting_started">getting started guide</a> for detailed introduction.

{@img scheduler/images/ext-scheduler.png}

*/
Ext.define("Sch.panel.SchedulerGrid", {
    extend                  : "Sch.panel.TimelineGridPanel",
    mixins                  : [ 
        'Sch.mixin.SchedulerPanel', 
        'Sch.patches.GroupingFeature'
    ],
    alias                   : [ 'widget.schedulergrid', 'widget.schedulerpanel'],
    alternateClassName      : 'Sch.SchedulerPanel',
        
    viewType                : 'schedulergridview',
    lockedXType             : 'gridpanel',
    normalXType             : 'schedulergrid',

    // HACK Sync group expand/collapse for the two views.
    onViewGroupExpand : function(v, groupName) {
        var featureProt = Ext.grid.feature.Grouping.prototype,
            groupBd = Ext.get(this.id + "-gp-" + groupName);
            
        groupBd.removeCls(featureProt.collapsedCls);
        groupBd.prev().removeCls(featureProt.hdCollapsedCls);
    },

    // HACK Sync group expand/collapse for the two views.
    onViewGroupCollapse : function(v, groupName) {
        var featureProt = Ext.grid.feature.Grouping.prototype,
            groupBd = Ext.get(this.id + "-gp-" + groupName);
            
        groupBd.addCls(featureProt.collapsedCls);
        groupBd.prev().addCls(featureProt.hdCollapsedCls);
    }
}, function() {     
    this.override(Sch.mixin.SchedulerPanel.prototype.inheritables() || {});
});
/** 

@class Sch.panel.SchedulerTree
@extends Sch.panel.TimelineTreePanel
@mixin Sch.mixin.SchedulerPanel

A complete scheduler panel using a tree view. This class can be used when you have a lot of resources organized in a hierarchical structure.

{@img scheduler/images/scheduler-tree.png}

Please refer to the {@link Sch.panel.SchedulerGrid} for additional documentation, as these classes
are virtually identical. This document will only provide the tree-specific details.

In the scheduler tree case:

- the `resourceStore` is expected to be an instance of the {@link Ext.data.TreeStore}. 
- the scheduler tree does not support the vertical orientation.
- the column, which will contain the tree itself, must have the `treecolumn` xtype:

        var schedulerTree = Ext.create('Sch.panel.SchedulerTree', {
            columns: [
                {
                    xtype       : 'treecolumn',
                    
                    text        : 'Name',
                    width       : 200,
                    sortable    : true,
                    dataIndex   : 'Name'
                }
            ]
        });


*/
Ext.define("Sch.panel.SchedulerTree", {
    extend      : "Sch.panel.TimelineTreePanel",
    mixins      : ['Sch.mixin.SchedulerPanel'], 
    alias       : [ 'widget.schedulertree'],
    requires    : ['Sch.view.SchedulerTreeView'],
    lockedXType : 'treepanel',
    normalXType : 'schedulertree',
    viewType    : 'schedulertreeview',
    
    setOrientation : function (orientation) {
        if (orientation == 'vertical') {
            throw new Error("Sch.panel.SchedulerTree does not support vertical orientation");
        }
    }
}, function() {
    this.override(Sch.mixin.SchedulerPanel.prototype.inheritables() || {});
});
/**
@class Sch.plugin.Printable

Plugin for printing an Ext Scheduler instance.

To use this plugin, add it to scheduler as usual. The plugin will add an additional `print` method to the scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.Printable', { 
                    // default values
                    docType             : '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">',
                    autoPrintAndClose   : true
                })
            ]
        });
        
        ...
        
        scheduler.print();
        

*/
Ext.define("Sch.plugin.Printable", {
    
    /**
     * @cfg {String} docType This is the DOCTYPE to use for the print window. It should be the same DOCTYPE as on your application page.
     */
    docType             : '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">',
    
    /**
     * @cfg {Ext.Template} printableEventTpl Empty by default, but you can override this to use a custom event template used for printing.
     * This way you can make sure background-colors and icons are printed the way you want.
     */
    printableEventTpl   : null,
    
    /**
     * An empty function by default, but provided so that you can perform a custom action
     * before the print plugin extracts data from the scheduler.
     * @param {SchedulerPanel} scheduler The scheduler instance
     * @method beforePrint
     */
    beforePrint         : Ext.emptyFn, 
    
    /**
     * An empty function by default, but provided so that you can perform a custom action
     * after the print plugin has extracted the data from the scheduler.
     * @param {SchedulerPanel} scheduler The scheduler instance
     * @method afterPrint
     */
    afterPrint          : Ext.emptyFn, 

    /**
     * @cfg {Boolean} autoPrintAndClose True to automatically call print and close the new window after printing. Default value is `true`
     */
    autoPrintAndClose   : true,

    scheduler           : null,
    
    
    constructor : function(config) {
        Ext.apply(this, config);
    },
    
    init : function(scheduler) {
        this.scheduler = scheduler;
        scheduler.print = Ext.Function.bind(this.print, this);
    },
    
    // private, the template for the new window
    mainTpl : '{docType}' +
          '<html class="x-border-box {htmlClasses}">' +
            '<head>' +
              '<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />' +
              '<title>{title}</title>' +
              '{styles}' +
            '</head>' +
            '<body class="sch-print-body {bodyClasses}">'+
                '<div class="sch-print-ct {componentClasses}" style="width:{totalWidth}px">'+
                    '<div class="sch-print-headerbg" style="border-left-width:{totalWidth}px;height:{headerHeight}px;"></div>'+
                    '<div class="sch-print-header-wrap">' +
                        '<div class="sch-print-lockedheader x-grid-header-ct x-grid-header-ct-default x-docked x-docked-top x-grid-header-ct-docked-top x-grid-header-ct-default-docked-top x-box-layout-ct x-docked-noborder-top x-docked-noborder-right x-docked-noborder-left">' +
                            '{lockedHeader}' +
                        '</div>'+
                        '<div style="left:{lockedWidth}px" class="sch-print-normalheader x-grid-header-ct x-grid-header-ct-default x-docked x-docked-top x-grid-header-ct-docked-top x-grid-header-ct-default-docked-top x-box-layout-ct x-docked-noborder-top x-docked-noborder-right x-docked-noborder-left">' +
                            '{normalHeader}' +
                        '</div>' +
                    '</div>'+
                    '<div style="width:{lockedWidth}px;top:{headerHeight}px;" class="sch-print-locked-rows-ct {innerLockedClasses} x-grid-inner-locked">' + 
                        '{lockedRows}' +
                    '</div>'+
                    '<div style="left:{[Ext.isIE ? values.lockedWidth : 0]}px;top:{headerHeight}px;width:{normalWidth}px" class="sch-print-normal-rows-ct {innerNormalClasses}">' + 
                        '{normalRows}' +
                    '</div>'+
                '</div>' +
                '<script type="text/javascript">'+
                    '{setupScript}'+ 
                '</script>'+
            '</body>'+
          '</html>',
    
    // private
    getGridContent : function(component) {
        var normalGrid = component.normalGrid,
            lockedGrid = component.lockedGrid,
            lockedView = lockedGrid.getView(),
            normalView = normalGrid.getView(),
            header, lockedRows, normalRows;
        
        this.beforePrint(component);
        
        // Render rows
        var records = lockedView.store.getRange();
        lockedRows = lockedView.tpl.apply(lockedView.collectData(records, 0));
        normalRows = normalView.tpl.apply(normalView.collectData(records, 0));
 
        this.afterPrint(component);
        
        return {
            normalHeader : normalGrid.headerCt.el.dom.innerHTML,
            lockedHeader : lockedGrid.headerCt.el.dom.innerHTML,
            lockedRows : lockedRows,
            normalRows : normalRows,
            lockedWidth : lockedGrid.getWidth(),
            normalWidth : normalGrid.getWidth(),
            headerHeight : normalGrid.headerCt.getHeight(),
            innerLockedClasses : lockedGrid.view.el.dom.className,
            innerNormalClasses : normalGrid.view.el.dom.className,
            width : component.getWidth()
        };
    },
    
    getStylesheets : function() {
        return Ext.getDoc().select('link[rel="stylesheet"]');
    },
    
    /**
     * Prints a scheduler panel. This method will be aliased to the main scheduler instance, so you can call it directly:
     * 
     *      scheduler.print()
     */
    print : function() {
        var component = this.scheduler;

        if (!(this.mainTpl instanceof Ext.Template)) {
            // Compile the tpl upon first call
            var headerRowHeight = 22;

            this.mainTpl = Ext.create("Ext.XTemplate", this.mainTpl, {
                compiled : true,
                disableFormats : true
            });
        }
    
        var v = component.getView(),
            styles = this.getStylesheets(),
            ctTmp = Ext.get(Ext.core.DomHelper.createDom({
                tag : 'div'
            })),
            styleFragment; 
        
        styles.each(function(s) {
            ctTmp.appendChild(s.dom.cloneNode(true));
        });
        
        styleFragment = ctTmp.dom.innerHTML + '';
        
        var gridContent = this.getGridContent(component),
            html = this.mainTpl.apply(Ext.apply({
                waitText : this.waitText,
                docType : this.docType,
                htmlClasses : '', // todo
                bodyClasses : Ext.getBody().dom.className,
                componentClasses : component.el.dom.className,
                title : (component.title || ''),
                styles : styleFragment,
                totalWidth : component.getWidth(),
                setupScript : "(" + this.setupScript.toString() + ")();"
            }, gridContent));
        
        var win = window.open('', 'printgrid');
    
        win.document.write(html);
        win.document.close();
        
        if (this.autoPrintAndClose) {
            win.print();
            // Chrome cannot print the page if you close the window being printed
            if (!Ext.isChrome) {
                win.close();
            }
        }
    },

    // Script executed in the newly open window, to sync row heights
    setupScript : function() {
        var tables = document.getElementsByTagName('table'),
            lockedTableCt = tables[tables.length - 2],
            normalTableCt = tables[tables.length - 1],
            lockedRows = lockedTableCt.getElementsByTagName('tr'),
            normalRows = normalTableCt.getElementsByTagName('tr'),
            count = lockedRows.length,
            i = 0;
            
        for (; i < count; i++) {
            lockedRows[i].style.height = normalRows[i].style.height;
        }
    }
});
/**
@class Sch.plugin.Lines
@extends Sch.feature.AbstractTimeSpan
 
Plugin for showing "global" time lines in the scheduler grid. It uses a store to populate itself, records in this store should have the following fields:

- `Date` The date of the line
- `Text` The Text to show when hovering over the line (optional)
- `Cls`  A CSS class to add to the line (optional)

To add this plugin to scheduler:

        var dayStore    = new Ext.data.Store({
            fields  : [ 'Date', 'Text', 'Cls' ],
            
            data    : [
                {
                    Date        : new Date(2011, 06, 19),
                    Text        : 'Some important day'
                }
            ]
        }); 


        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.Lines', { store : dayStore })
            ]
        });


*/
Ext.define("Sch.plugin.Lines", {
    extend      : "Sch.feature.AbstractTimeSpan",    
    
    
    init : function(scheduler) {
        this.callParent(arguments);
        
        var view = this.schedulerView;
        
        if (!this.template) {
            this.template = new Ext.XTemplate(
                '<tpl for=".">',
                    '<div title="{[this.getTipText(values)]}" class="sch-timeline {uniquecls} {Cls}" style="left:{left}px;top:{top}px;height:{height}px;width:{width}px"></div>',
                '</tpl>',
                {
                    getTipText : function (values) {
                        return view.getFormattedDate(values.Date) + ' ' + (values.Text || "");
                    }
                }
            );       
        }
    },
    
    
    getElementData : function(viewStart, viewEnd) {
        var s = this.store,
            scheduler = this.schedulerView,
            rs = s.getRange(),
            data = [],
            height = this.containerEl.getHeight(),
            r, date, region, width;

        for (var i = 0, l = s.getCount(); i < l; i++) {
            r = rs[i];
            date = r.get('Date');
            
            if (Ext.Date.between(date, viewStart, viewEnd)) {
                region = scheduler.getTimeSpanRegion(date);
                
                data[data.length] = Ext.apply({
                    left : region.left,
                    top : region.top,
                    width : Math.max(1, region.right-region.left),
                    height : region.bottom - region.top
                }, r.data);
            }
        }
        return data;
    }
}); 

/**
@class Sch.plugin.CurrentTimeLine
@extends Sch.plugin.Lines

Plugin indicating the current date and time as a line in the schedule. 

To add this plugin to scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.CurrentTimeLine', { updateInterval : 30000 })
            ]
        });


*/
Ext.define("Sch.plugin.CurrentTimeLine", {
    extend              : "Sch.plugin.Lines",
    
    /**
     * @cfg {String} tooltipText The text to show in the tooltip next to the current time (defaults to 'Current time').
     */
    tooltipText         : 'Current time',
    
    /**
     * @cfg {Int} updateInterval This value (in ms) defines how often the timeline shall be refreshed. Defaults to every once every minute.
     */
    updateInterval      : 60000,
    
    /**
     * @cfg {Boolean} autoUpdate true to automatically update the line position over time. Default value is `true`
     */
    autoUpdate          : true,
    
    
    init : function(cmp) {
        var store = Ext.create("Ext.data.JsonStore", {
            model : Ext.define("TimeLineEvent", {
                extend : 'Ext.data.Model',
                fields : ['Date', 'Cls', 'Text']
            }),
            data : [{Date : new Date(), Cls : 'sch-todayLine', Text : this.tooltipText}]
        });
            
        var record = store.first();

        if (this.autoUpdate) {
            this.runner = Ext.create("Ext.util.TaskRunner");
            this.runner.start({
                run: function() {
                    record.set('Date', new Date());
                },
                interval: this.updateInterval 
            });
        }

        cmp.on('destroy', this.onHostDestroy, this);
        
        this.store = store;
        this.callParent(arguments);
    },

    onHostDestroy : function() {
        if (this.runner) {
            this.runner.stopAll();
        }

        if (this.store.autoDestroy) {
            this.store.destroy();
        }
    }
}); 

/**
@class Sch.plugin.DragSelector
@extends Ext.util.Observable

Plugin for selecting multiple events by "dragging" an area in the scheduler chart. Currently only enabled **when CTRL is pressed**

{@img scheduler/images/drag-selector.png}

To add this plugin to scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.DragSelector')
            ]
        });


*/
Ext.define("Sch.plugin.DragSelector", {
    extend : "Sch.util.DragTracker", 
    
    constructor : function(cfg) {
        cfg = cfg || {};

        Ext.applyIf(cfg,  {
            onBeforeStart: this.onBeforeStart,
            onStart: this.onStart,
            onDrag: this.onDrag,
            onEnd: this.onEnd
        });
        
        this.callParent(arguments);
    },

    init : function(scheduler){
        scheduler.on({
            afterrender : this.onSchedulerRender, 
            destroy : this.onSchedulerDestroy, 
            scope : this
        });

        this.scheduler = scheduler;
    },
    
    onBeforeStart : function (e){
        return e.ctrlKey;
    },

    onStart : function (e){
        var schedulerView = this.schedulerView;

        if (!this.proxy) {
            this.proxy = schedulerView.el.createChild({ cls:'sch-drag-selector x-view-selector' });
        } else {
            this.proxy.show();
        }
        this.bodyRegion = schedulerView.getScheduleRegion();

        var eventData = [];
        schedulerView.getEventNodes().each(function(el){
            eventData[eventData.length] = {
                region : el.getRegion(),
                node : el.dom
            };
        }, this);

        this.eventData = eventData;

        this.sm.deselectAll();
    },

    onDrag : function (e){
        var sm = this.sm,
            eventData = this.eventData,
            dragRegion = this.getRegion().constrainTo(this.bodyRegion),
            i, ev, len, sel;

        this.proxy.setRegion(dragRegion);

        for(i = 0, len = eventData.length; i < len; i++){
            ev = eventData[i]; 
            sel = dragRegion.intersect(ev.region);

            if(sel && !ev.selected) {
                ev.selected = true;
                sm.selectNode(ev.node, true);
            }else if(!sel && ev.selected) {
                ev.selected = false;
                sm.deselectNode(ev.node);
            }
        }
    },

    onEnd : function (e){
        if(this.proxy){
            this.proxy.setDisplayed(false);
        }
    },

    onSchedulerRender : function (s){
        this.sm = s.getEventSelectionModel();
        this.schedulerView = s.getSchedulingView();
        this.initEl(s.el);
    },

    onSchedulerDestroy : function() {
        Ext.destroy(this.proxy);

        this.destroy();
    }
});

  
/**
@class Sch.plugin.EventEditor
@extends Ext.form.FormPanel

A plugin used to edit event start/end dates as well as any meta data. It inherits from {@link Ext.form.FormPanel} so you can define any fields and use any layout you want.

{@img scheduler/images/event-editor.png}

Normally, this plugin shows the same form for all events. However you can show different forms for different event types. To do that:

- the event type is supposed to be provided as the value of the `EventType` field in the event model.
- in the {@link #fieldsPanelConfig} provide the container with card layout. The children of that container should be the forms which will be used to edit different 
event types
- each such form should contain the `EventType` configuration option, mathing to the appropriate event type.
- the small top form, containing the start date, start time and duration fields is always shared among all forms.
- this whole behavior can be disabled with the `dynamicForm : false` option.

The overall picture will look like:
            fieldsPanelConfig : {
                xtype       : 'container',
                
                layout      : 'card',
                    
                items       : [
                    // form for "Meeting" EventType
                    {
                        EventType   : 'Meeting',
                        
                        xtype       : 'form',
                        
                        items       : [
                            ...
                        ]                    
                    },
                    // eof form for "Meeting" EventType
                    
                    // form for "Appointment" EventType
                    {
                        EventType   : 'Appointment',
                        
                        xtype       : 'form',
                        
                        items       : [
                            ...
                        ]                    
                    }
                    // eof form for "Appointment" EventType
                ]
            }   

Note, that you can customize the start date, start time and duration fields with appropriate configuration options: {@link #dateConfig}, {@link #timeConfig}, {@link #durationConfig}


        var eventEditor    = Ext.create('Sch.plugin.EventEditor', {
            ...
            timeConfig      : {
                minValue    : '08:00',
                maxValue    : '18:00'
            },
            ...
        }); 


        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                eventEditor
            ]
        });
*/
Ext.define("Sch.plugin.EventEditor", {
    extend      : "Ext.form.FormPanel",
    
    requires    : [
        'Sch.util.Date'
    ],
    
    
    /**
     * @cfg {String} saveText The text to show on the save button
     */
    saveText            : 'Save',

    /**
     * @cfg {String} deleteText The text to show on the delete button
     */
    deleteText          : 'Delete',
    
    /**
     * @cfg {String} cancelText The text to show on the cancel button
     */
    cancelText          : 'Cancel',

    /**
     * @cfg {Boolean} hideOnBlur True to hide this panel if a click is detected outside the panel (defaults to true)
     */
    hideOnBlur          : true,
     
    /**
     * This property provides access to the start date field 
     * @property {Ext.form.field.Date} startDateField
     */
    startDateField      : null,
    
    /**
     * This property provides access to the start time field
     * @property {Ext.form.field.Time} startTimeField
     */
    startTimeField      : null,
     
    /**
     * This property provides access to the duration spinner field 
     * @property {Ext.form.field.Number} durationField
     */
    durationField       : null,
                 
    /**
     * @cfg {Object} timeConfig Config for the `startTimeField` constructor.
     */
    timeConfig          : null,
    
    /**
     * @cfg {Object} dateConfig Config for the `startDateField` constructor.
     */
    dateConfig          : null,
    
    /**
     * @cfg {Object} durationConfig A custom config object that is used to configure the {@link Ext.form.field.Number duration field}.
     */
    durationConfig      : null,
    
    /**
     * @cfg {String} durationUnit The unit in which the duration is measured, defaults to Sch.util.Date.HOUR.
     */
    durationUnit        : null,
    
    /**
     * @cfg {String} durationText The text to show after the duration spinner field
     */
    durationText        : null,

    /**
     * @cfg {String} triggerEvent The event that shall trigger showing the editor. Defaults to 'eventdblclick', set to '' or null to disable editing of existing events.
     */
    triggerEvent        : 'eventdblclick',

    /**
     * @cfg {Object} fieldsPanelConfig A panel config representing your fields that is associated with a scheduled event.
     * 
     * Example:
     
        fieldsPanelConfig : {
            layout      : 'form',
            
            style       : 'background : #fff',
            border      : false,
            cls         : 'editorpanel',
            labelAlign  : 'top',
            
            defaults    : {
                width : 135
            },
            
            items       : [
                titleField      = new Ext.form.TextField({
                    name            : 'Title',
                    fieldLabel      : 'Task'
                }),
                
                locationField   = new Ext.form.TextField({
                    name            : 'Location',
                    fieldLabel      : 'Location'
                })
            ]
        }
     * 
     */
    fieldsPanelConfig   : null,
    
    /**
     * @cfg {String} dateFormat This config parameter is passed to the `startDateField` constructor.
     */
    dateFormat          : 'Y-m-d',
    
    /**
     * @cfg {String} timeFormat This config parameter is passed to the `startTimeField` constructor.
     */
    timeFormat          : 'H:i',
    
    
    cls                 : 'sch-eventeditor',
    border              : false,
    
    /**
     * @cfg {Boolean} dynamicForm True to use several forms. Default is `true`.
     */
    dynamicForm         : true,
    
    /**
     * @property {Ext.data.Model} eventRecord The current {@link Sch.model.Event} record, which is being edited by the event editor 
     */
    eventRecord         : null,
    
    currentForm         : null,
    scheduler           : null,
    schedulerView       : null,
    
    
    /**
     * @cfg {Boolean} constrain Pass `true` to enable the constraining - ie editor panel will not exceed the document edges. This option will disable the animation
     * during the expansion. Default value is `false`.  
     */
    constrain           : false,
    
    
    
    
    constructor : function(config) {
        config              = config || {};
        
        this.durationUnit   = config.durationUnit || Sch.util.Date.HOUR;
        
        this.addEvents(
            /**
            * @event beforeeventdelete
            * Fires before an event is deleted (return false to cancel the operation)
            * @param {Sch.plugin.EventEditor} editor The editor instance
            * @param {Ext.data.Model} eventRecord The record about to be deleted
            */
            'beforeeventdelete',

            /**
            * @event beforeeventsave
            * Fires before an event is saved (return false to cancel the operation)
            * @param {Sch.plugin.EventEditor} editor The editor instance
            * @param {Ext.data.Model} eventRecord The record about to be saved
            */
            'beforeeventsave'
        );

        this.callParent(arguments);
    },

    
    initComponent : function() {
        
        if (!this.fieldsPanelConfig) throw 'Must define a fieldsPanelConfig property';
        
        Ext.apply(this, {
            fbar            : this.buildButtons(),
            
            // is ignored
            preventHeader   : true,
            floating        : true,
            hideMode        : 'offsets',
            
            layout          : {
                type    : 'vbox',
                align   : 'stretch'
            },
            
            items           : [
                {
                    layout  : 'hbox',
                    height  : 35,
                    border  : false,
                    cls     : 'sch-eventeditor-timefields',
                    
                    items   : this.buildDurationFields()
                },
                Ext.applyIf(this.fieldsPanelConfig, {
                    flex        : 1,
                    activeItem  : 0
                })
            ]
        });
        
        this.callParent(arguments);
    },

    
    init : function (scheduler) {
        this.scheduler      = scheduler;
        this.schedulerView  = scheduler.getSchedulingView(); 
        this.eventStore     = scheduler.getEventStore();

        this.schedulerView.on({
            afterrender     : this.onSchedulerRender,
            destroy         : this.onSchedulerDestroy,
            dragcreateend   : this.onDragCreateEnd,
            
            scope           : this
        });
            
        if (this.triggerEvent) {
            this.schedulerView.on(this.triggerEvent, this.onActivateEditor, this);
        }   
        
        this.schedulerView.registerEventEditor(this);
    },
    
    
    onSchedulerRender : function() {
        this.render(Ext.getBody());
        
        this.collapse();
        this.hide();
        
        if (this.hideOnBlur) {
            // Hide when clicking outside panel
            this.mon(Ext.getDoc(), 'mousedown', this.onMouseDown, this);
        }
    },
    
    
    /**
     * Expands the editor
     * @param {Ext.data.Model} eventRecord The record to show in the editor panel
     */
    show : function (eventRecord, alignToEl) {
        
        // Only show delete button if the event belongs to a store
        if (this.deleteButton) {
            this.deleteButton.setVisible(eventRecord.store); 
        }
        
        this.eventRecord = eventRecord;
        
        // Manually set the duration field value
        this.durationField.setValue(Sch.util.Date.getDurationInUnit(eventRecord.getStartDate(), eventRecord.getEndDate(), this.durationUnit));
        
        var startDate = eventRecord.getStartDate();
        this.startDateField.setValue(startDate);
        this.startTimeField.setValue(startDate);
        
        this.callParent([]);
        
        alignToEl = alignToEl || this.schedulerView.getElementFromEventRecord(eventRecord);
        
        this.alignTo(alignToEl, this.scheduler.orientation == 'horizontal' ? 'bl' : 'tl-tr', this.getConstrainOffsets(alignToEl));
        
        // need to expand the form first, for correct layouting
        this.expand(!this.constrain);
        
        if (this.constrain) {
            this.doConstrain(Ext.util.Region.getRegion(Ext.getBody()));
        }
        
        var form,
            eventType = eventRecord.get('EventType');
        
        if (eventType && this.dynamicForm) {
            var fieldsPanel     = this.items.getAt(1),
                forms           = fieldsPanel.query('> component[EventType=' + eventType + ']');
            
            if (!forms.length)                                  {
                throw "Can't find form for EventType=" + eventType;
            }
            if (!fieldsPanel.getLayout().setActiveItem)         {
                throw "Can't switch active component in the 'fieldsPanel'";
            }
            
            form = forms[ 0 ];
            
            if (!(form instanceof Ext.form.Panel))              {
                throw "Each child component of 'fieldsPanel' should be a 'form'";
            }
            
            fieldsPanel.getLayout().setActiveItem(form);
        } else {
            form = this;
        }
        
        this.currentForm = form;
        
        // get the "basicForm" from current form and load it from event record
        form.getForm().loadRecord(eventRecord);
    },
    
    // Override this to add support for constraining the editor panel to the viewport or scheduler
    getConstrainOffsets : function(eventEl) {
        return [0, 0];
    },
    

    onSaveClick : function() {
        var formPanel   = this,
            record      = formPanel.eventRecord,
            form        = this.currentForm.getForm();
        
        if (form.isValid() && this.fireEvent('beforeeventsave', this, record) !== false) {

            var startDate   = formPanel.startDateField.getValue(),
                endDate,
                startTime   = formPanel.startTimeField.getValue(),
                duration    = formPanel.durationField.getValue();

            if (startDate && duration >= 0) {
                
                if (startTime) {
                    startDate.setHours(startTime.getHours());
                    startDate.setMinutes(startTime.getMinutes());
                    startDate.setSeconds(startTime.getSeconds());
                }
                
                endDate = Sch.util.Date.add(startDate, this.durationUnit, duration);
            } else {
                return;
            }
            
            // Manually located the event resource for new records
            var resource = record.store ? record.getResource() : this.resourceRecord;

            if (!this.schedulerView.allowOverlap && !this.schedulerView.isDateRangeAvailable(startDate, endDate, record, resource)) {
                return;
            }

            record.beginEdit();
            
            // wrap the call to `updateRecord` with the code, which
            // disables the `endEdit` method of the record
            // this will prevent the double "update" event from being fired (and double "sync" call) 
            // (as we need to batch the form update with our own updates)
            // this is ugly, but `updateRecord` should been really providing the parameter 
            // to omit the `beginUpdate/endUpdate` calls..
            var prevEndEdit = record.endEdit;
            record.endEdit = Ext.emptyFn;
            
            form.updateRecord(record);
            
            record.endEdit = prevEndEdit;
            
            record.setStartDate(startDate);
            record.setEndDate(endDate);
            
            record.endEdit();

            // Check if this is a new record
            if (!this.eventRecord.store) {
                if (this.schedulerView.fireEvent('beforeeventadd', this.schedulerView, record) !== false) {
                    this.eventStore.add(record);
                }
            }
            formPanel.collapse(null, true);
        }
    },
    

    onDeleteClick : function() {
        if (this.fireEvent('beforeeventdelete', this, this.eventRecord) !== false) {
            this.eventStore.remove(this.eventRecord);
        }
        this.collapse(null, true);
    },

    
    onCancelClick : function() {
        this.collapse(null, true);
    },

    
    buildButtons : function() {
        
        this.saveButton = new Ext.Button({
            text        : this.saveText,
            
            scope       : this,
            handler     : this.onSaveClick
        });

        this.deleteButton = new Ext.Button({
            text        : this.deleteText,
            
            scope       : this,
            handler     : this.onDeleteClick
        });
        
        this.cancelButton = new Ext.Button({
            text        : this.cancelText,
            
            scope       : this,
            handler     : this.onCancelClick
        });

        return [ this.saveButton, this.deleteButton, this.cancelButton ];
    },

    
    buildDurationFields : function() {
        
        this.startDateField = new Ext.form.field.Date(Ext.apply({
            width           : 90,
            
            allowBlank      : false,
            
            format          : this.dateFormat
        }, this.dateConfig || {}));
        
        this.startTimeField = new Ext.form.field.Time(Ext.apply({
            
            width           : 70,
            style           : 'margin-left : 5px',
            
            allowBlank      : false,
            
            format          : this.timeFormat
            
        }, this.timeConfig || {}));
        
                    
        this.durationField = new Ext.form.field.Number(Ext.apply({
            
            width           : 45,
            
            value           : 0,
            
            minValue        : 0,
            allowNegative   : false,
            
            style           : 'margin-left : 15px'
        }, this.durationConfig || {}));
        
                    
        this.durationLabel = Ext.create("Ext.form.Label", {
            text            : this.getDurationText(),
            
            style           : 'margin-left : 5px'
        });

        return [ this.startDateField, this.startTimeField, this.durationField, this.durationLabel ];
    },

    
    onActivateEditor : function(g, evtRecord) {
        this.show(evtRecord);
    },
    
    
    onMouseDown : function(e){
        if (
            this.collapsed || e.within(this.getEl()) || 
            // ignore the click on the menus and combo-boxes (which usually floats as the direct child of <body> and
            // leaks through the `e.within(this.getEl())` check
            e.getTarget('.x-layer') ||
            
            // if clicks should be ignored for any other element - it should have this class
            e.getTarget('.sch-event-editor-ignore-click') ||
            
            // also ignore the clicks on the events - those will be processed by other listeners
            e.getTarget('.sch-event')
        ) {        
            return;
        }
        
        this.collapse();
    },

    
    onSchedulerDestroy : function() {
        this.destroy();
    },

    
    onDragCreateEnd : function(s, eventRecord, resourceRecord) {
        if (!this.dragProxyEl && this.schedulerView.dragCreator) {
            this.dragProxyEl = this.schedulerView.dragCreator.getProxy();
        }

        this.resourceRecord = resourceRecord;

        // Call scheduler template method
        this.schedulerView.onEventCreated(eventRecord);

        this.show(eventRecord, this.dragProxyEl);
    },

    
    // Always hide drag proxy on collapse
    afterCollapse : function() {
        var dpEl = this.dragProxyEl;
       
        if (dpEl) {
            dpEl.hide();
        }
         
        // currently the header is kept even after collapse, so need to hide the form completely
        this.hide();
        
        this.callParent(arguments);
    },
    
    
    getDurationText : function () {
        if (this.durationText) {
            return this.durationText;
        }
        
        var dateUnits   = Sch.util.Date;
        
        // TODO move to Sch.util.Date
        switch (this.durationUnit) {
            case    dateUnits.MILLI     : return 'ms';
            case    dateUnits.SECOND    : return 's';
            case    dateUnits.MINUTE    : return 'min';
            case    dateUnits.HOUR      : return 'hrs';
            case    dateUnits.DAY       : return 'days';
            case    dateUnits.WEEK      : return 'wks';
            case    dateUnits.MONTH     : return 'mths';
            case    dateUnits.QUARTER   : return 'qrts';
            case    dateUnits.YEAR      : return 'yrs';
        }
        
        throw new Error("Invalid duration unit value");
    }
});

/**
@class Sch.plugin.Pan

A plugin enabling panning by clicking and dragging in a scheduling view.

To add this plugin to your scheduler or gantt view:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.Pan', { enableVerticalPan : true })
            ]
        });


*/
Ext.define("Sch.plugin.Pan", {
    alias : 'plugin.pan',

    /**
     * @cfg {Boolean} enableVerticalPan
     * True to allow vertical panning
     */
    enableVerticalPan   : true,
    
    panel               : null,
    
    
    constructor : function(config) {
        Ext.apply(this, config);
    },

    init : function(pnl) {
        this.panel  = pnl.lockedGrid || pnl;
        this.view   = pnl.getSchedulingView();
        
        this.view.on('afterrender', this.onRender, this);
    },

    onRender: function(s) {
        this.view.el.on('mousedown', this.onMouseDown, this, { delegate : '.' + this.view.timeCellCls });
    },

    onMouseDown: function(e, t) {
        // ignore clicks on tasks and events
        if (e.getTarget('.' + this.view.timeCellCls) && !e.getTarget(this.view.eventSelector)) {
            this.mouseX = e.getPageX();
            this.mouseY = e.getPageY();
            Ext.getBody().on('mousemove', this.onMouseMove, this);
            Ext.getDoc().on('mouseup', this.onMouseUp, this);
        }
    },

    onMouseMove: function(e) {
        e.stopEvent();
        
        var x = e.getPageX(),
            y = e.getPageY(),
            xDelta = x - this.mouseX,
            yDelta = y - this.mouseY;

        this.panel.scrollByDeltaX(-xDelta);
        this.mouseX = x;
        this.mouseY = y;
        
        if (this.enableVerticalPan) {
            this.panel.scrollByDeltaY(-yDelta);
        }
    },

    onMouseUp: function(e) {
        Ext.getBody().un('mousemove', this.onMouseMove, this);
        Ext.getDoc().un('mouseup', this.onMouseUp, this);
    }   
});

/**
@class Sch.plugin.SimpleEditor
@extends Ext.Editor

Simple plugin for editing event names/titles inline.

{@img scheduler/images/simple-editor.png}

To add this plugin to scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.SimpleEditor', { dataIndex : 'Title' })
            ]
        });


*/
Ext.define("Sch.plugin.SimpleEditor", {
    extend          : "Ext.Editor",
    
    
    cls             : 'sch-simpleeditor',
    allowBlur       : false,
    newEventText    : 'New booking...',
    
    // private
    delegate        : '.sch-event-inner',
    
    /**
     * @cfg {String} dataIndex Required. A field, containing the task's title. This field will be updated by the editor. Defaults to the value of the {@link Sch.model.Event#nameField}.
     */ 
    dataIndex       : null,

    completeOnEnter     : true,
    cancelOnEsc         : true,
    ignoreNoChange      : true,
    height              : 19,
    
    autoSize            : {
        width   : 'boundEl' // The width will be determined by the width of the boundEl, the height from the editor (21)
    },

    
    constructor : function(config) {
        config = config || {};
        config.field = config.field || Ext.create("Ext.form.TextField", { selectOnFocus : true });
        this.callParent(arguments);
    },

    
    init : function(scheduler) {
        this.scheduler = scheduler.getSchedulingView();

        scheduler.on('afterrender', this.onSchedulerRender, this);
        this.scheduler.registerEventEditor(this);
        
        this.dataIndex = this.dataIndex || this.scheduler.getEventStore().model.prototype.nameField;
    },

    // Programmatically enter edit mode
    edit : function(record, el) {
        el = el || this.scheduler.getElementFromEventRecord(record);
        this.startEdit(el.child(this.delegate));
        this.record = record;
        this.setValue(this.record.get(this.dataIndex));
    },

    
    onSchedulerRender : function(scheduler) {

        this.on({
            complete : function(editor, value, original) {
                var record = this.record;
                record.set(this.dataIndex, value);
                
                // Check if this is a new record
                if (!record.store) {
                    if (this.scheduler.fireEvent('beforeeventadd', this.scheduler, record) !== false) {
                        this.scheduler.eventStore.add(record);
                    }
                }
            },
            hide : function() {
                if (this.dragProxyEl) {
                    this.dragProxyEl.hide();
                }
            },
            scope : this
        });
        
        scheduler.on({
            eventdblclick : function(s, r, e){
                this.edit(r);
            }, 
            dragcreateend: this.onDragCreateEnd,
            scope : this
        });

        scheduler.el.on('mousedown', function() {
            this.cancelEdit();
        }, this);
    },

    onDragCreateEnd : function(s, eventRecord) {
        if (!this.dragProxyEl && this.scheduler.dragCreator) {
            this.dragProxyEl = this.scheduler.dragCreator.getProxy();
        }

        // Call scheduler template method
        this.scheduler.onEventCreated(eventRecord);
        
        if (eventRecord.get(this.dataIndex) === '') {
            eventRecord.set(this.dataIndex, this.newEventText);
        }
        this.edit(eventRecord, this.dragProxyEl);
    }
}); 

/**
@class Sch.plugin.SummaryColumn
@extends Ext.grid.column.Column

Plugin, showing the currently allocated time for the resources. It will simply summarize the durations **of the events that are in the current view**. 
The information can be displayed as either a time unit or a percentage of the available time.

To add this plugin to scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            columns         : [
                ...
                {
                    xtype       : 'summarycolumn',
                    header      : '% allocated',
                    showPercent : true
                },
                ...
            ]
        });

*/
Ext.define('Sch.plugin.SummaryColumn', {
    extend      : "Ext.grid.column.Column",
    
    alias       : "widget.summarycolumn",
    
    /**
     * @cfg {Boolean} showPercent True to show percentage values, false to show summarized time. Default value is `false`.
     */
    showPercent : false,
    
    /**
     * @cfg {Int} nbrDecimals The number of decimals to show, only applicable when `showPercent` is set to false
     */
    nbrDecimals : 1,
    
    /**
     * @cfg {String} dayText The text to show after a period of days, only applicable if `showPercent` is false
     */
    dayText     : 'd',
    
    /**
     * @cfg {String} hourText The text to show after a period of hours, only applicable if `showPercent` is false
     */
    hourText    : 'h',
    
    /**
     * @cfg {String} minuteText The text to show after a period of minutes, only applicable if `showPercent` is false
     */
    minuteText  : 'min',
    
    
    sortable        : false,
    fixed           : true,
    menuDisabled    : true,
    
    width           : 80,
    dataIndex       : '_sch_not_used',
    
    
    constructor : function(config){
        this.scope = this;
        this.callParent(arguments);
    },
    
    
    init : function(scheduler) {
        this.scheduler = scheduler;

        // This plugin requires the scheduler to refresh its locked grid when the unlocked scheduler view is refreshed
        // e.g. when currently viewed timespan is changed.
        this.scheduler.lockedGridDependsOnSchedule = true;

        this.eventStore = scheduler.eventStore;
    },
    
    
    renderer : function(v, p, record){
        var g = this.scheduler,
            s = this.eventStore,
            viewStart = g.getStart(),
            viewEnd = g.getEnd(),
            retVal = 0,
            totalAllocatedMinutesInView = this.calculate(record.getEvents(), viewStart, viewEnd);
        
        if (totalAllocatedMinutesInView <= 0) {
            return '';
        }
        
        if (this.showPercent) {
            var timeInView = Sch.util.Date.getDurationInMinutes(viewStart, viewEnd);
            return (Math.round((totalAllocatedMinutesInView * 100)/ timeInView)) + ' %';
        } else {
            if (totalAllocatedMinutesInView > 1440) {
                return (totalAllocatedMinutesInView / 1440).toFixed(this.nbrDecimals) + ' ' + this.dayText;
            }
            if (totalAllocatedMinutesInView >= 30) {
                return (totalAllocatedMinutesInView / 60).toFixed(this.nbrDecimals) + ' ' + this.hourText;
            }
            return totalAllocatedMinutesInView + ' ' + this.minuteText;
        }
    },
    
    calculate : function(eventRecords, viewStart, viewEnd){
        var totalTime = 0,
            eventStart,
            eventEnd,
            D = Sch.util.Date;
       
        Ext.each(eventRecords, function(eRec) {
            eventStart = eRec.getStartDate();
            eventEnd = eRec.getEndDate();
                
            if (D.intersectSpans(viewStart, viewEnd, eventStart, eventEnd)) {
               totalTime += D.getDurationInMinutes(D.max(eventStart, viewStart), D.min(eventEnd, viewEnd)); 
            }
        });
        
        return totalTime;
    }
});
/**
@class Sch.plugin.Zones
@extends Sch.feature.AbstractTimeSpan

Plugin for showing "global" zones in the scheduler grid, these can by styled easily using just CSS. 
To populate this plugin you need to pass it a store having the `Sch.model.Range` as the model.

{@img scheduler/images/scheduler-grid-horizontal.png}

To add this plugin to scheduler:

        var zonesStore = Ext.create('Ext.data.Store', {
            model   : 'Sch.model.Range',
            data    : [
                {
                    StartDate   : new Date(2011, 0, 6),
                    EndDate     : new Date(2011, 0, 7),
                    Cls         : 'myZoneStyle'
                }
            ]
        });

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.Zones', { store : zonesStore })
            ]
        });


*/
Ext.define("Sch.plugin.Zones", {
    extend      : "Sch.feature.AbstractTimeSpan",
    
    requires    : [
        'Sch.model.Range'
    ],
    
    
    init:function(scheduler) {
        if (!this.template) {
            this.template = new Ext.XTemplate(
                '<tpl for=".">',
                    '<div class="sch-zone {uniquecls} {Cls}" style="left:{left}px;top:{top}px;height:{height}px;width:{width}px"></div>',
                '</tpl>'
            );
        }
        this.callParent(arguments);
    },

    
    getElementData : function(viewStart, viewEnd) {
        var s = this.store,
            scheduler = this.schedulerView,
            rs = s.getRange(),
            data = [],
            r, spanStart, spanEnd, region;
            
        for (var i = 0, l = s.getCount(); i < l; i++) {
            r = rs[i];
            spanStart = r.get('StartDate');
            spanEnd = r.get('EndDate');
            
            if (Sch.util.Date.intersectSpans(spanStart, spanEnd, viewStart, viewEnd)) {
                region = scheduler.getTimeSpanRegion(Sch.util.Date.max(spanStart, viewStart), Sch.util.Date.min(spanEnd, viewEnd));
                region.left = region.left-1;

                data[data.length] = Ext.apply({
                    left : region.left,
                    top : region.top,
                    width : region.right-region.left,
                    height : region.bottom - region.top
                }, r.data);
            }
        }
        return data;
    }
}); 

/**
@class Sch.plugin.TimeGap
@extends Sch.plugin.Zones

Plugin for highlighting unallocated slots of time for all resources. You can use the `getZoneCls` method to customize the css class of the "gaps".

{@img scheduler/images/plugin-timegap.png}

To add this plugin to scheduler:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...
    
            resourceStore   : resourceStore,
            eventStore      : eventStore,
            
            plugins         : [
                Ext.create('Sch.plugin.TimeGap', {
                
                    getZoneCls : function (startDate, endDate) {
                        return 'myGapCls'
                    }
                })
            ]
        });

*/
Ext.define("Sch.plugin.TimeGap", {
    extend: "Sch.plugin.Zones", 
    
    /**
     * An empty function by default, but provided so that you can return a custom CSS class for each unallocated zone area
     * @param {Date} start The start date of the unallocated time slot
     * @param {Date} end The end date of the unallocated time slot
     * @return {String} The CSS class to be applied to the zone element
     */
    getZoneCls : Ext.emptyFn,
  
    init:function(scheduler) {
        
        this.store = new Ext.data.JsonStore({
             model : 'Sch.model.Range'
        });

        this.scheduler = scheduler;

        scheduler.eventStore.on({
            'load' : this.populateStore, 
            'update' : this.populateStore, 
            'remove' : this.populateStore, 
            'add' : this.populateStore, 
            'datachanged' : this.populateStore, 
            scope : this
        });
        
        scheduler.on('viewchange', this.populateStore, this);

        this.schedulerView = scheduler.getSchedulingView();

        this.callParent(arguments);
    },
    
    populateStore : function(eventStore) {
        var eventsInView = this.schedulerView.getEventsInView(),
            timeGaps = [],
            viewStart = this.scheduler.getStart(),
            viewEnd = this.scheduler.getEnd(),
            l = eventsInView.getCount(),
            cursor = viewStart,
            eventStart,
            index = 0,
            r;
        
        // Sort by start time    
        eventsInView.sortBy(function(r1, r2) {
            return r1.getStartDate() - r2.getStartDate();
        });

        r = eventsInView.getAt(0);
        
        while(cursor < viewEnd && index < l) {
            eventStart = r.getStartDate();
            
            if (!Sch.util.Date.betweenLesser(cursor, eventStart, r.getEndDate()) && cursor < eventStart) {
                timeGaps.push(new this.store.model({
                    StartDate : cursor,
                    EndDate : eventStart,
                    Cls : this.getZoneCls(cursor, eventStart) || ''
                }));
            }
            cursor = Sch.util.Date.max(r.get('EndDate'), cursor);
            index++; 
            r = eventsInView.getAt(index);
        }
        
        // Check if there's a gap between last cursor and view end time
        if (cursor < viewEnd) {
            timeGaps.push(new this.store.model({
                StartDate : cursor,
                EndDate : viewEnd,
                Cls : this.getZoneCls(cursor, viewEnd) || ''
            }));
        }
        
        // Don't refresh twice, the add will cause the zones to redraw
        this.store.removeAll(timeGaps.length > 0);
        this.store.add(timeGaps);
    }
}); 

/**
@class Sch.plugin.TreeCellEditing
@extends Ext.grid.plugin.CellEditing

A specialized "cell editing" plugin, purposed to correctly work with trees. Add it to your component (scheduler with tree view or gantt)
as usual grid plugin:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        
        plugins             : [
            Ext.create('Sch.plugin.TreeCellEditing', {
                clicksToEdit: 1
            })
        ],
        ...
    })
*/
Ext.define("Sch.plugin.TreeCellEditing", {
    extend : "Ext.grid.plugin.CellEditing",
    
    // IE7 breaks otherwise
    startEditByClick: function(view, cell, colIdx, record, row, rowIdx, e) {
        // do not start editing when click occurs on the expander icon
        if (e.getTarget(view.expanderSelector)) {
            return;
        }
        
        this.callParent(arguments);
    },
    

    startEdit: function(record, columnHeader) {
// MODIFICATION
        if (!record || !columnHeader) {
            return;
        }
// EOF MODIFICATION
        
        var me = this,
            ed   = me.getEditor(record, columnHeader),
            value = record.get(columnHeader.dataIndex),
            context = me.getEditingContext(record, columnHeader);

        record = context.record;
        columnHeader = context.column;

        // Complete the edit now, before getting the editor's target
        // cell DOM element. Completing the edit causes a view refresh.
        me.completeEdit();

        // See if the field is editable for the requested record
        if (columnHeader && !columnHeader.getEditor(record)) {
            return false;
        }
        
        if (ed) {
            context.originalValue = context.value = value;
            if (me.beforeEdit(context) === false || me.fireEvent('beforeedit', context) === false || context.cancel) {
                return false;
            }

            me.context = context;
            me.setActiveEditor(ed);
            me.setActiveRecord(record);
            me.setActiveColumn(columnHeader);

// MODIFICATION
            // Defer, so we have some time between view scroll to sync up the editor
//                                                    enables the correct tabbing      enables the value adjustment in the 'beforeedit' event 
//                                                           |                                |    
            me.editTask.delay(15, ed.startEdit, ed, [me.getCell(record, columnHeader), context.value, context]);
// EOF MODIFICATION
            
        } else {
            // BrowserBug: WebKit & IE refuse to focus the element, rather
            // it will focus it and then immediately focus the body. This
            // temporary hack works for Webkit and IE6. IE7 and 8 are still
            // broken
            me.grid.getView().getEl(columnHeader).focus((Ext.isWebKit || Ext.isIE) ? 10 : false);
        }
    },

    getEditingContext: function(record, columnHeader) {
        var me = this,
            grid = me.grid,
            store = grid.store,
            rowIdx,
            colIdx,
            view = grid.getView(),
            value;

        
        if (Ext.isNumber(record)) {
            rowIdx = record;
            record = store.getAt(rowIdx);
        } else {
            if (store.indexOf) {
                rowIdx = store.indexOf(record);
            } else {
                rowIdx = view.indexOf(view.getNode(record));
            }
        }
        if (Ext.isNumber(columnHeader)) {
            colIdx = columnHeader;
            columnHeader = grid.headerCt.getHeaderAtIndex(colIdx);
        } else {
            colIdx = columnHeader.getIndex();
        }

        value = record.get(columnHeader.dataIndex);
        return {
            grid: grid,
            record: record,
            field: columnHeader.dataIndex,
            value: value,
            row: view.getNode(rowIdx),
            column: columnHeader,
            rowIdx: rowIdx,
            colIdx: colIdx
        };
    },

    startEditByPosition: function(position) {
        var me = this,
            grid = me.grid,
            sm = grid.getSelectionModel(),
            view = me.view,
            node = this.view.getNode(position.row);

            editColumnHeader = grid.headerCt.getHeaderAtIndex(position.column);
            editRecord = view.getRecord(node);

        if (sm.selectByPosition) {
            sm.selectByPosition(position);
        }
        me.startEdit(editRecord, editColumnHeader);
    }
});
/**
 * English translations for the Scheduler component
 *
 * NOTE: To change locale for month/day names you have to use the corresponding Ext JS language pack.
 */
Ext.onReady(function() {
    if (Sch.plugin && Sch.plugin.SummaryColumn) {
        Ext.override(Sch.plugin.SummaryColumn, {
            dayText : 'd',
            hourText : 'h',
            minuteText : 'min'
        });
    }

    if (Sch.plugin.CurrentTimeLine) {
        Sch.plugin.CurrentTimeLine.prototype.tooltipText = 'Current time';
    }

    if (Sch.plugin && Sch.plugin.EventEditor) {
        Ext.override(Sch.plugin.EventEditor, {
            durationText : 'hrs',
            saveText: 'Save',
            deleteText: 'Delete',
            cancelText: 'Cancel'
        });
    }
});
