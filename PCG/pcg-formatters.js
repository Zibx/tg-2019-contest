(function(PCG){

    var weekDays = 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',');
    var months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'Jule',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
    var shortMonths = months.map(function(name) {
        return name.substr(0,3);
    });
    shortMonths[8] = 'Sept';

    var second = 1000,
        minute = PCG.MINUTE = second * 60,
        hour = PCG.HOUR =  minute * 60,
        day = PCG.DAY = hour*24;
    PCG.dateFormatter = function(date, minDelta){
        if(!(date instanceof Date)){
            date = new Date(Math.round(date/minDelta)*minDelta);
        }
        if(minDelta === day){
            return shortMonths[ date.getMonth() ] + ' ' + date.getDate();
        }else{
            return date.getHours() + ':' + PCG.pad(date.getMinutes());
        }
    };
    PCG.JdateFormatter = function(date, minDelta){
        if(!(date instanceof Date)){
            date = new Date(Math.round(date/minDelta)*minDelta);
        }

        return date.getDate()+' '+shortMonths[ date.getMonth() ]+' '+date.getFullYear();

    };
    PCG.weekDateFormatter = function(date){
        if(!(date instanceof Date)){
            date = new Date(Math.round(date/day)*day);
        }
        return weekDays[date.getDay()]+', '+PCG.dateFormatter(date, day);
    };
    PCG.numberFormat = function(num) {
        var strNum = num+'',

            i,
            out = [],
            _i = strNum.length,
            count = (_i%3)||3,
            last = count;

        out.push(strNum.substr(0, count));
        count = 3;
        for(i = last; i < _i; i+=3){
            out.push(strNum.substr(i, count))
        }
        return out.join(' ');
    };
    var floor = Math.floor;
    PCG.numberFormatMega = function(num) {
        if(num>1000000000){
            return floor(num/1000000000)+'G';
        }else if(num>1000000){
            return floor(num/1000000)+'M';
        }else if(num>1000){
            return floor(num/1000)+'K';
        }
        return num;
    }

})(window['PCG']);