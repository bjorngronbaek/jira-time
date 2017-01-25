import React, { Component, PropTypes } from 'react';
import keycode from 'keycode';

import Sync from 'shared/sync';
import DateInput from 'modules/DateInput';

import ExportIcon from 'assets/export.svg';
import LoadingIcon from 'assets/loading.svg';

import './RecordItem.scss';

export default class RecordItem extends Component {

    static propTypes = {
        record: PropTypes.object.isRequired,
        recordCuid: PropTypes.string.isRequired,
        removeRecord: PropTypes.func.isRequired,
        setRecordDate: PropTypes.func.isRequired,
        setRecordComment: PropTypes.func.isRequired,
        setRecordMoving: PropTypes.func.isRequired,
        setRecordMoveTarget: PropTypes.func.isRequired,
        setRecordTask: PropTypes.func.isRequired,
        stopRecording: PropTypes.func.isRequired,
        activeRecord: PropTypes.object,
        movingRecord: PropTypes.object,
        autofocus: PropTypes.bool,
        movingTask: PropTypes.object,
        taskIndex: PropTypes.number,
        recordIndex: PropTypes.number
    }

    constructor (props) {
        super(props);

        this.onStartTimeChange = this.onStartTimeChange.bind(this);
        this.onEndTimeChange = this.onEndTimeChange.bind(this);
        this.onRemoveClick = this.onRemoveClick.bind(this);
        this.onCommentBlur = this.onCommentBlur.bind(this);
        this.onCommentKeyDown = this.onCommentKeyDown.bind(this);
        this.onSyncClick = this.onSyncClick.bind(this);
        this.onStopRecordingClick = this.onStopRecordingClick.bind(this);
        this.getCommentTabIndex = this.getCommentTabIndex.bind(this);

        this.state = {};
    }

    componentDidMount () {
        const { record } = this.props;

        // Determine if the issue was just updated (less than 100ms ago)
        let justCreated = false;
        if (record.createdTime) {
            justCreated = (new Date() - new Date(record.createdTime)) < 100;
        }

        if (this.inputComment && justCreated) {
            this.inputComment.select();
            if (this.inputComment.scrollIntoViewIfNeeded) {
                this.inputComment.scrollIntoViewIfNeeded();
            } else {
                this.scrollIntoView();
            }
        }
        
        this.setDatesTabIndex();
    }

    componentDidUpdate () {
        this.setDatesTabIndex();
    }

    onStartTimeChange ({ date }) {
        this.props.setRecordDate({
            cuid: this.props.record.cuid,
            startTime: date,
            endTime: this.props.record.endTime
        });
    }

    onEndTimeChange ({ date }) {
        this.props.setRecordDate({
            cuid: this.props.record.cuid,
            startTime: this.props.record.startTime,
            endTime: date
        });
    }

    onCommentBlur (e, force) {

        this.setState({
            commentSelectionStart: e.target.selectionStart
        });

        this.props.setRecordComment({
            cuid: this.props.record.cuid,
            comment: e.target.value
        });
    }

    onCommentKeyDown (e) {
        const command = keycode(e);
        if ((command === 'down' || command === 'up') && e.altKey) {
            e.preventDefault();

            const draggableTasks = document.querySelector('.tasks-draggable');
            const limboTask = document.querySelector('.task-item--limbo');
            if (draggableTasks && limboTask) {
                const allRecordsInLimbo = Array.from(limboTask.querySelectorAll('.record[data-cuid]'));
                const allRecordsOnPage = Array.from(draggableTasks.querySelectorAll('.record[data-cuid]'));
                const allRecords = [...allRecordsInLimbo, ...allRecordsOnPage];
                const currentRecordPosition = allRecords.findIndex((record) => {
                    return record.dataset.cuid === this.recordElement.dataset.cuid;
                });
                const nextRecordItem = allRecords[currentRecordPosition + (command === 'up' ? -1 : 1)];
                if (nextRecordItem) {
                    const nextRecordComment = nextRecordItem.querySelector('.record-comment');
                    if (nextRecordComment) {
                        nextRecordComment.select();
                    }
                }
                return;
            }
            e.target.blur();
        }
    }

    onRemoveClick () {
        this.props.removeRecord({ cuid: this.props.record.cuid });
    }

    onStopRecordingClick () {
        this.props.stopRecording();
    }

    onSyncClick () {
        const syncer = new Sync({
            records: [this.props.record]
        });

        syncer.start();
    }

    getTabIndexBase () {
        return ((this.props.taskIndex + 1) + this.props.recordIndex) * 10;
    }

    setDatesTabIndex () {
        const [inputStart, inputEnd] = Array.from(this.recordDates.querySelectorAll('input:not(.flatpickr-input)'));
        if (inputStart) {
            inputStart.tabIndex = this.getTabIndexBase() + 1;
        }
        if (inputEnd) {
            inputEnd.tabIndex = this.getTabIndexBase() + 2;
        }
    }

    getCommentTabIndex () {
        return this.getTabIndexBase() + 3;
    }

    render () {

        let { record, movingRecord, movingTask } = this.props;

        const somethingIsMoving = !!movingRecord || !!movingTask;

        let className = 'record';
        if (record.syncing) {
            className += ' record--syncing';
        }
        if (this.props.activeRecord && this.props.activeRecord.cuid === record.cuid) {
            className += ' record--active';
        }
        if (record.moving) {
            className += ' record--moving';
        }

        let btnSync;
        if (record.syncing) {
            btnSync = (
                <div className='record__sync record__sync--syncing' title='Syncing!'>
                    <img className='record__sync-icon' src={LoadingIcon} alt='Loading' />
                </div>
            );
        } else if (!record.endTime) {
            btnSync = (
                <div className='record__sync record__sync--stop'
                  onClick={this.onStopRecordingClick}
                  title='Stop recording'
                />
            );
        } else {
            btnSync = (
                <div className='record__sync' onClick={this.onSyncClick} title='Sync this worklog to JIRA'>
                    <img className='record__sync-icon' src={ExportIcon} alt='Export' />
                </div>
            );
        }

        return (
            <div className={className} data-cuid={record.cuid} ref={e => this.recordElement = e}>
                <button className='record-remove' onClick={this.onRemoveClick} disabled={record.syncing}>x</button>
                <div className='record-time'>
                    <div className='record-dates' ref={e => this.recordDates = e}>
                        <DateInput
                          date={record.startTime}
                          onChange={this.onStartTimeChange}
                          disabled={somethingIsMoving}
                        />
                        {record.endTime ? (
                            <DateInput
                              date={record.endTime}
                              onChange={this.onEndTimeChange}
                              disabled={somethingIsMoving}
                            />
                        ) : (
                        null
                        )}
                    </div>
                    <span className='record__elapsed-time'>{record.elapsedTime}</span>
                </div>
                <input
                  className='record-comment'
                  onBlur={this.onCommentBlur}
                  onKeyDown={this.onCommentKeyDown}
                  defaultValue={record.comment}
                  disabled={somethingIsMoving}
                  tabIndex={this.getCommentTabIndex()}
                  ref={e => this.inputComment = e}
                />
                {btnSync}
            </div>
        );
    }
}
