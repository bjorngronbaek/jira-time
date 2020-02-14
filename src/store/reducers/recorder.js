import moment from 'moment';

import RecordModel from 'store/models/RecordModel';
import TaskModel from 'store/models/TaskModel';

import { REMOVE_TASK } from 'store/reducers/tasks';

const initialState = {
    records: [],
    task: null
};

const regex = /(\d+)m/;
function getTimeFromWorklogComment (comment) {
    const match = regex.exec(comment);
    return match ? parseInt(match[1]) : 15; // If the is no time, we default to 15 minutes
}

// ------------------------------------
// Constants
// ------------------------------------
export const ADD_RECORDING = 'ADD_RECORDING';
export const START_RECORDING = 'START_RECORDING';
export const STOP_RECORDING = 'STOP_RECORDING';
export const SET_RECORD_SYNC = 'SET_RECORD_SYNC';
export const SET_RECORD_DATE = 'SET_RECORD_DATE';
export const SET_RECORD_COMMENT = 'SET_RECORD_COMMENT';
export const SET_RECORD_MOVING = 'SET_RECORD_MOVING';
export const SET_RECORD_MOVE_TARGET = 'SET_RECORD_MOVE_TARGET';
export const SET_RECORD_TASK = 'SET_RECORD_TASK';
export const UPDATE_RECORD_ELAPSED = 'UPDATE_RECORD_ELAPSED';
export const REMOVE_RECORD = 'REMOVE_RECORD';
export const SPLIT_RECORD = 'SPLIT_RECORD';

export function getElapsedTime({ startTime, endTime }) {
    startTime = moment(startTime);
    endTime = moment(endTime);

    const diff = endTime.unix() - startTime.unix();

    if (diff < 0) {
        return 'Dude, negative time?';
    }

    const d = moment.duration(diff, 'seconds');

    let outputString = `${d.minutes()}m`;
    if (d.hours() !== 0) {
        outputString = `${d.hours()}h ` + outputString;
    }
    if (d.days() !== 0) {
        outputString = `${d.days()}d ` + outputString;
    }

    return outputString;
}

export function getRoundedTime(time) {
    var minuteInMs = 60000;
    return Math.round(time / minuteInMs) * minuteInMs;
}

// ------------------------------------
// Actions
// ------------------------------------
export function addRecord({ task, record } = {}) {
    return {
        type: ADD_RECORDING,
        task,
        record
    };
}
export function startRecording({ task, record } = {}) {
    return {
        type: START_RECORDING,
        task,
        record
    };
}
export function stopRecording() {
    return {
        type: STOP_RECORDING
    };
}
export function setRecordSync({ cuid, syncing }) {
    return {
        type: SET_RECORD_SYNC,
        cuid,
        syncing
    };
}
export function setRecordDate({ cuid, startTime, endTime }) {
    return {
        type: SET_RECORD_DATE,
        cuid,
        startTime,
        endTime
    };
}
export function setRecordComment({ cuid, comment }) {
    return {
        type: SET_RECORD_COMMENT,
        cuid,
        comment
    };
}
export function setRecordTask({ cuid, taskCuid, taskIssueKey }) {
    return {
        type: SET_RECORD_TASK,
        cuid,
        taskCuid,
        taskIssueKey
    };
}
export function setRecordMoving({ cuid, moving }) {
    return {
        type: SET_RECORD_MOVING,
        cuid,
        moving
    };
}
export function setRecordMoveTarget({ cuid, taskCuid }) {
    return {
        type: SET_RECORD_MOVE_TARGET,
        cuid,
        taskCuid
    };
}
export function updateRecordElapsed({ cuid }) {
    return {
        type: UPDATE_RECORD_ELAPSED,
        cuid
    };
}
export function removeRecord({ cuid }) {
    return {
        type: REMOVE_RECORD,
        cuid
    };
}

export function splitRecord({ cuid, task }) {
    return {
        type: SPLIT_RECORD,
        cuid,
        task
    };
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
    [ADD_RECORDING]: (state, action) => {
        const records = [...state.records];

        // Determine which task to log to
        const task = action.task || TaskModel();
        const record = action.record || RecordModel({ task });

        records.push(record);

        return {
            ...state,
            records
        };
    },
    [START_RECORDING]: (state, action) => {
        const records = stopRecordingInState({ state });

        // Determine which task to start recording
        const task = action.task || TaskModel();

        // Start new recording
        const record = action.record || RecordModel({ task });
        record.elapsedTime = getElapsedTime({ startTime: record.startTime, endTime: record.startTime });
        records.push(record);

        return {
            ...state,
            task,
            records
        };
    },
    [STOP_RECORDING]: state => {
        return {
            ...initialState,
            records: stopRecordingInState({ state })
        };
    },
    [REMOVE_TASK]: (state, action) => {
        const records = [];
        state.records.forEach(record => {
            if (record.taskCuid !== action.cuid) {
                records.push(record);
            }
        });

        let task = state.task;
        if (task && task.cuid === action.cuid) {
            task = initialState.task;
        }

        return {
            ...state,
            task,
            records
        };
    },
    [SET_RECORD_SYNC]: (state, action) => {
        const records = state.records.map(record => {
            if (record.cuid === action.cuid) {
                return Object.assign({}, record, {
                    syncing: action.syncing
                });
            }

            return record;
        });

        return {
            ...state,
            records
        };
    },
    [SET_RECORD_DATE]: (state, action) => {
        const { startTime, endTime } = action;

        const records = state.records.map(record => {
            if (record.cuid === action.cuid) {
                return {
                    ...record,
                    startTime,
                    endTime,
                    elapsedTime: getElapsedTime({ startTime, endTime })
                };
            }

            return record;
        });

        return {
            ...state,
            records
        };
    },
    [SET_RECORD_COMMENT]: (state, action) => {
        const records = state.records.map(record => {
            if (record.cuid === action.cuid) {
                return Object.assign({}, record, {
                    comment: action.comment
                });
            }

            return record;
        });

        return {
            ...state,
            records
        };
    },
    [SET_RECORD_TASK]: (state, action) => {
        const { taskCuid, taskIssueKey } = action;

        const records = state.records.map(record => {
            if (record.cuid === action.cuid) {
                return Object.assign({}, record, {
                    taskCuid,
                    taskIssueKey,
                    moving: false,
                    taskDroppableCuid: null
                });
            }

            return record;
        });

        return {
            ...state,
            records
        };
    },
    [SET_RECORD_MOVING]: (state, action) => {
        const records = state.records.map(record => {
            if (record.cuid === action.cuid) {
                return Object.assign({}, record, {
                    moving: action.moving
                });
            }

            return record;
        });

        return {
            ...state,
            records
        };
    },
    [SET_RECORD_MOVE_TARGET]: (state, action) => {
        const records = state.records.map(record => {
            if (record.cuid === action.cuid) {
                return Object.assign({}, record, {
                    taskDroppableCuid: action.taskCuid
                });
            }

            return record;
        });

        return {
            ...state,
            records
        };
    },
    [UPDATE_RECORD_ELAPSED]: (state, action) => {
        const records = state.records.map(record => {
            if (record.cuid === action.cuid) {
                const { startTime, endTime } = record;
                return Object.assign({}, record, {
                    elapsedTime: getElapsedTime({ startTime, endTime })
                });
            }
            return record;
        });

        return {
            ...state,
            records
        };
    },
    [REMOVE_RECORD]: (state, action) => {
        const records = [];
        state.records.forEach(record => {
            if (record.cuid !== action.cuid) {
                records.push(record);
            }
        });

        return {
            ...state,
            records
        };
    },
    [SPLIT_RECORD]: (state, action) => {

        /* Find the record that was clicked, so we can see if it's ready for splitting */
        let records = [...state.records];
        const recordIndex = records.findIndex(r => r.cuid === action.cuid);
        const originalRecord = { ...records[recordIndex] };

        /* Check that the record is not running, so it can't be split yet */
        if (originalRecord.endTime === undefined) {
            return {
                ...state,
                records
            };
        }

        /* Get the comment and see if has parts that can be split */
        const splitComments = originalRecord.comment.split('|').map(s => s.trim());
        if (splitComments.length > 1) {

            /* calculate the time spent on splits - the first split is the "main" task, and keeps its own time */
            let totalSplitTime = 0;
            for (let i = 1; i < splitComments.length; i += 1) {
                totalSplitTime += getTimeFromWorklogComment(splitComments[i]);
            }

            /* Check if the total split time exceeds the task time */
            const endTime = moment(originalRecord.endTime);
            const startTime = moment(originalRecord.startTime);
            const taskTime = endTime.diff(startTime, 'minutes', true);
            if (totalSplitTime < taskTime) {
                /* Reduce the time of the original record with the total split time and set the comment */
                const newEndTime = endTime.clone().subtract(totalSplitTime, 'minutes');
                records = records.map(record => {
                    if (record.cuid === action.cuid) {
                        return Object.assign({}, record, {
                            comment: splitComments[0],
                            endTime: newEndTime,
                            elapsedTime: `${newEndTime.diff(startTime, 'minutes', true)}m` // TODO should use getElapsedTime instead
                        });
                    }

                    return record;
                });

                // TODO create the new records from the splits
                let recordStartTime = newEndTime;
                const { task } = action;
                for (let i = 1; i < splitComments.length; i += 1) {
                    const record = RecordModel({ task });

                    record.comment = splitComments[i].replace(regex, '');
                    record.startTime = recordStartTime.clone();
                    record.endTime = recordStartTime.clone().add(getTimeFromWorklogComment(splitComments[i]), 'minutes');
                    record.elapsedTime = `${record.endTime.diff(record.startTime, 'minutes', true)}m`; // TODO should use getElapsedTime instead

                    recordStartTime = record.endTime;

                    records.push(record);
                }
            }
        }

        return {
            ...state,
            records
        };
    },
    SERVER_STATE_PUSH: (state, { recorder }) => recorder
};

// Listen for logout. Clear everything if we do
/* ACTION_HANDLERS[SET_LOGGED_IN] = (state, action) => {
    const records = [...state.records];

    if (state.record) {
        records[records.length - 1] = Object.assign({}, records[records.length - 1], {
            endTime: Date.now(),
            elapsedTime: getElapsedTime({ startTime: records[records.length - 1].startTime })
        });
    }

    return {
        record: initialState.record,
        task: initialState.task,
        records
    }
}; */

function stopRecordingInState({ state }) {
    let records = [...state.records];
    let recordIndex = records.findIndex(r => !r.endTime);
    if (recordIndex !== -1) {
        records[recordIndex].endTime = getRoundedTime(Date.now());
        records[recordIndex] = {
            ...records[recordIndex],
            elapsedTime: getElapsedTime({
                startTime: records[recordIndex].startTime,
                endTime: records[recordIndex].endTime
            })
        };
    }

    return records;
}

// ------------------------------------
// Getters
// ------------------------------------
export const getRecordsForTask = ({ state, taskCuid }) => state.recorder.records.filter(r => r.taskCuid === taskCuid);

export const getRecords = ({ state }) => state.recorder.records;

export const getRecordsWithNoIssue = ({ state }) => state.recorder.records.filter(r => !r.taskIssueKey);

export const getActiveRecord = ({ state }) => state.recorder.records.find(r => !r.endTime);

export const getNotSyncedRecords = ({ state }) => state.recorder.records.filter(r => !!r.endTime);

export const getMovingRecord = ({ state }) => state.recorder.records.find(r => r.moving);

export const getNumberOfRecords = ({ state, taskCuid }) => {
    return state.recorder.records.filter(r => r.taskCuid === taskCuid).length;
};

// ------------------------------------
// Reducer
// ------------------------------------
export default function recorderReducer(state = initialState, action) {
    const handler = ACTION_HANDLERS[action.type];

    return handler ? handler(state, action) : state;
}
