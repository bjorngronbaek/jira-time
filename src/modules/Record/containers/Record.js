import { connect } from 'react-redux';

import {
  stopRecording,
  removeRecord,
  setRecordDate,
  setRecordMoving,
  setRecordComment,
  setRecordMoveTarget,
  setRecordTask,
  getActiveRecord,
  getMovingRecord
} from 'store/reducers/recorder';

import {
    getTask,
    getMovingTask,
    getTaskFromJiraIssueKey
} from 'store/reducers/tasks';

import Record from '../components/Record';

const mapStateToProps = (state, props) => {
    return {
        profile: state.profile,
        task: getTask({ state, taskCuid: props.record.taskCuid }),
        jiraIssueKeyTask : getTaskFromJiraIssueKey({ state, jiraIssueKey: props.record.jiraIssueKey }),
        activeRecord: getActiveRecord({ state }),
        movingRecord: getMovingRecord({ state }),
        movingTask: getMovingTask({ state })
    };
}

const mapDispatchToProps = {
    stopRecording,
    removeRecord,
    setRecordDate,
    setRecordMoving,
    setRecordComment,
    setRecordTask,
    setRecordMoveTarget
};

export default connect(mapStateToProps, mapDispatchToProps)(Record);
