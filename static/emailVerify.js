import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Header } from './header.js';


export class EmailValidate extends React.Component {
    constructor(props) {
        super(props)
        const {pathname} = this.props.location
        const token = pathname.replace('/verify/', '')
        this.state = {username: '',
                      token: token,
                      isLoading: false}
        this.myIsMounted = false
        this.handleChangeUser = this.handleChangeUser.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)}

    componentDidMount() {
        this.myIsMounted = true}

    componentWillUnmount () {
        this.myIsMounted = false}

    handleChangeUser(event) {
        this.setState({ username: event.target.value})}

    handleSubmit(event) {
        event.preventDefault();
        if (!this.state.username){
          alert("must enter a username")
          return}
        this.myIsMounted && this.setState({isLoading: true})
        if (!this.props.isVerify) {
            return}
        else {
            let xhr = new XMLHttpRequest()
            const url = '/v1/users/confirm'
            xhr.open("POST", url, true)
            xhr.setRequestHeader("Content-Type", "application/json")
            xhr.onreadystatechange = (event) => this.handleApiResponse(xhr)
            const datas = JSON.stringify({
                username: this.state.username,
                token: this.state.token})
            xhr.send(datas)}}

    handleApiResponse(xhr) {
        if (xhr.readyState == 2 && xhr.status == 200) {
            //if it works delete the credentials here before moving on.
            this.setState({username: '',
                           token: '',
                           isLoading: false})
            this.props.history.push('/home')}
        else if (xhr.readyState == 2 && xhr.status !== 200) {
            alert(xhr.responseText)
            this.setState({isLoading: false})}}

    render () {return (<>
        <Header history={this.props.history}
                inner={this.props.location['pathname'].match('verify$') ?
                        "Verify Email" : "Reset Password"} />
            <div className="w3-margin w3-row-padding">
                <div className="w3-content">
                    <form method="POST"
                          onSubmit={(event) => this.handleSubmit(event)}
                          className={"w3-card " +
                                     "w3-round " +
                                     "w3-form " +
                                     "w3-padding"}>
                    {this.props.isVerify ? (<>
                        <h1 className="w3-yellow w3-center w3-xxlarge">
                            Confirm Username</h1>
                        <p>
                        <label htmlFor="username">
                          username
                        </label>
                        <input  type="text"
                                className="w3-input w3-round w3-padding-16"
                                maxLength={254}
                                size={254}
                                value={this.state.username}
                                name="username"
                                onChange={(event) => this.handleChangeUser(event)} />
                        </p>
                        <div className="w3-container w3-center w3-padding-16">
                          { !this.state.isLoading ? (
                            <input  type="submit"
                                    id="cp_button"
                                    value="Finish and Login"
                                    className="w3-action w3-button w3-hover-yellow w3-indigo" />
                          ) : (
                            <label htmlFor="cp_button">
                              <i className="fa fa-cog fa-spin fa-fw fa-3x"></i>
                            </label>) }
                        </div></>)
                    : (<>
                        <h1 className="w3-green w3-center w3-xxlarge">
                            Success!</h1>
                        <p>We have sent a verification to your e-mail. Please
                        use the link provided there to login.</p></>
                    )}</form></div></div></>)}}
