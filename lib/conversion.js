const dayjs = require('dayjs');
const config = require('../config');

// [{
//     "startDate": "20160112T011049Z",
//     "endDate": "20160112T011618Z",
//     "description": "号码：110 (已拨电话)\\n时长：00",
//     "location": "",
//     "summary": "至 xxxx 的已拨电话"
// }]

exports.logsToMsg = function (arr) {
    return arr.map(v => {
        const sDate = dayjs(conversionTime(v.startDate));
        let duration = 0;
        if (v.endDate) {
            const eDate = dayjs(conversionTime(v.endDate));
            duration = dayjs(eDate).diff(dayjs(sDate), 'second');
        }

        const parseDes = v.description.match(/^号码：(.+)\s\((.+)\)/);

        const number = parseDes[1];
        const typeD = parseDes[2];

        const parseSummary = v.summary.match(/^(.+)\s(.+)\s的(.+)/);

        const direction = directionHandle(parseSummary[1]);
        const name = parseSummary[2];
        const typeS = parseSummary[3];

        // 验证由两个地方获得到的 type 是否一致
        if (typeD !== typeS) throw new Error('Type not same', v);

        const type = getType(typeS, duration);

        const send = {};
        const receive = {};

        if (direction === 'go') {
            send.sender = config.rightNum;
            send.senderName = config.rightName;

            receive.receiver = number;
            receive.receiverName = name;
        }

        if (direction === 'come') {
            send.sender = number;
            send.senderName = name;

            receive.receiver = config.rightNum;
            receive.receiverName = config.rightName;
        }

        return {
            source: 'CallLog',
            device: 'Phone',
            type,

            direction,

            ...send,
            ...receive,

            day: sDate.format('YYYY-MM-DD'),
            time: sDate.format('HH:mm:ss'),
            ms: sDate.valueOf(),

            // "content": "",
            // "html": "",

            // 按类型的特殊属性
            $CallLog: {
                duration,
            },
            $Dev: {
                msAccuracy: false,
            },
        };
    });
};

function conversionTime(s) {
    let _s = s;
    _s = insertStr(_s, 13, ':');
    _s = insertStr(_s, 11, ':');
    _s = insertStr(_s, 6, '-');
    _s = insertStr(_s, 4, '-');
    return _s;
}

function insertStr(source, start, newStr) {
    return source.slice(0, start) + newStr + source.slice(start);
}

function directionHandle(str) {
    switch (str) {
        case '至':
            return 'go';
        case '自':
            return 'come';
        default:
            throw new Error('unknown direction', str);
    }
}

// [呼入已接, 呼入未接, 呼入挂断, 呼出未接, 呼出已接];
// "未接来电", "已拨电话", "已接来电"
function getType(type, duration) {
    switch (type) {
        case '未接来电':
            return '呼入未接';
        case '已拨电话':
            return duration === 0 ? '呼出未接' : '呼出已接';
        case '已接来电':
            return duration === 0 ? '呼入未接' : '呼入已接';
        default:
            throw new Error('unknown type', type);
    }
}
