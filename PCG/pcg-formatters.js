(function(PCG){

    const weekDays = 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',');
    const months = [
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
    const shortMonths = months.map(function(name) {
        return name.substr(0,3);
    });
    shortMonths[8] = 'Sept';

    var second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour*24;
    PCG.dateFormatter = (date)=>{
        if(!(date instanceof Date)){
            date = new Date(Math.round(date/day)*day);
        }
        return shortMonths[date.getMonth()] +' '+ date.getDate();
    };
    PCG.weekDateFormatter = (date)=>{
        if(!(date instanceof Date)){
            date = new Date(Math.round(date/day)*day);
        }
        return weekDays[date.getDay()]+', '+PCG.dateFormatter(date);
    };
    PCG.numberFormat = function(num) {
        const strNum = num+'';
        let i,
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

})(window['PCG']);