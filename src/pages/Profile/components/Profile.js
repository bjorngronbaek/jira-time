import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { logout, updateUserInfo } from 'shared/jiraClient';

import ThemeSelector from 'modules/ThemeSelector';
import Login from 'modules/Login';
import UserIcon from 'assets/user.svg';

import './Profile.scss';

const browserHasSpeechRecognition = 'webkitSpeechRecognition' in window;

const version = __VERSION__;
const isDevelopment = __DEV__;

export class Profile extends Component {
    static get propTypes() {
        return {
            profile: PropTypes.object.isRequired,
            setLoggedIn: PropTypes.func.isRequired,
            setUserPreferences: PropTypes.func.isRequired
        };
    }

    constructor(props) {
        super(props);

        this.onLogoutClick = this.onLogoutClick.bind(this);
    }

    componentDidMount() {
        updateUserInfo();
    }

    onLogoutClick() {
        logout();
        this.props.setLoggedIn({ isLoggedIn: false });
    }

    updateUserPreferences(updatedPreferences) {
        const { preferences } = this.props.profile;

        this.props.setUserPreferences({
            preferences: {
                ...preferences,
                ...updatedPreferences
            }
        });
    }

    createPreferenceCheckboxField({ label, property }) {
        const { preferences } = this.props.profile;

        return (
            <div className="profile-preferences-field">
                <label>
                    <span className="profile-preferences-label">{label}</span>
                    <input
                        className="profile-preferences-input"
                        type="checkbox"
                        checked={preferences[property]}
                        onChange={e =>
                            this.updateUserPreferences({
                                [property]: e.target.checked
                            })
                        }
                    />
                </label>
            </div>
        );
    }

    render() {
        if (!this.props.profile.loggedIn) {
            return <Login />;
        }

        const { userinfo } = this.props.profile;
        const { avatarUrls } = userinfo;

        let avatarUrl = UserIcon;
        const avatarSize = '48x48';
        if (avatarUrls) {
            avatarUrl = avatarUrls[avatarSize].replace('http://localhost:3000', '/');
        }

        const development = isDevelopment ? ' - DEVELOPMENT' : null;

        return (
            <div className="profile">
                <div className="profile-avatar">
                    <img className="profile-avatar-img" src={avatarUrl} alt={userinfo.name} title={userinfo.name} />
                </div>
                <ThemeSelector />
                <div className="profile-bottom">
                    <div className="profile-section">
                        <h2 className="profile-section-heading">Settings</h2>
                        <div className="profile-preferences">
                            {browserHasSpeechRecognition &&
                                this.createPreferenceCheckboxField({
                                    label: 'Enable voice recording',
                                    property: 'enableVoiceRecording'
                                })}
                            {false &&
                                this.createPreferenceCheckboxField({
                                    label: 'Connect to sync server',
                                    property: 'connectToSyncServer'
                                })}
                            {this.createPreferenceCheckboxField({
                                label: 'Compact tasks view',
                                property: 'compactView'
                            })}
                            {this.createPreferenceCheckboxField({
                                label: 'Split limbo and tasks vertically',
                                property: 'verticalLimboSplit'
                            })}
                            {false &&
                                this.createPreferenceCheckboxField({
                                    label: 'Enable animations',
                                    property: 'enableAnimations'
                                })}
                            {this.createPreferenceCheckboxField({
                                label: 'Enable worklog splitting',
                                property: 'enableWorklogSplitting'
                            })}
                        </div>
                    </div>

                    <div className="profile-section">
                        <h2 className="profile-section-heading">Shortcuts</h2>
                        <table className="profile-shortcuts">
                            <tbody>
                                <tr>
                                    <td className="profile-shortcuts-cell">A:</td>
                                    <td className="profile-shortcuts-cell">add issue(s)</td>
                                </tr>
                                <tr>
                                    <td className="profile-shortcuts-cell">UP/DOWN in comment:</td>
                                    <td className="profile-shortcuts-cell">navigate between worklog comments</td>
                                </tr>
                                <tr>
                                    <td className="profile-shortcuts-cell">CTR+F:</td>
                                    <td className="profile-shortcuts-cell">search in tasks list</td>
                                </tr>
                                <tr>
                                    <td className="profile-shortcuts-cell">CTR+S:</td>
                                    <td className="profile-shortcuts-cell">sync all worklogs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <button className="profile-logout btn" onClick={this.onLogoutClick}>
                        Log out
                    </button>

                    <div className="profile-version">
                        Version {version}
                        {development}
                    </div>
                </div>
            </div>
        );
    }
}

export default Profile;
