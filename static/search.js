import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Header } from './header.js';
import { Request, LinkDispList } from './utils.js';


class SearchResults extends LinkDispList {
    constructor(props){
      super(props);
      this.state = {
        selectedItems: new Set()
      };
    }

    renderList(){
        let list = []
        let hasContent = false

        for (const item of this.props.items){
            const searchlc = this.props.search.toLowerCase()
            const iName = item.name.toLowerCase()
            // the item must be in the search result or search must be empty.
            if (iName.includes(searchlc) || this.props.search == ''){
                hasContent = true
                item['hasContent'] = true
                list.push(this.renderItem(item))}}
        if (!hasContent && this.props.isLoading) {
            list.push(this.renderItem({name: "one", isLoading: true}))
            list.push(this.renderItem({name: "two", isLoading: true}))
            list.push(this.renderItem({name: "three", isLoading: true}))}
        else if (!hasContent && !this.props.isLoading) {
            list.push(this.renderItem({ name: "one", isEmpty: true}))
            list.push(this.renderItem({name: "two", isEmpty: true}))
            list.push(this.renderItem({name: "three", isEmpty: true}))}
        return list}}


export class SearchList extends React.Component {
    constructor(props) {
        super(props)
        const {pathname} = this.props.location
        const params = pathname.replace( /\/search\//, '')
        const catagory = params.replace( /\/.*/, '')
        const orderBy = params.replace( /.*\//, '')
        const displayCatagories = { mealPlans: ['Present -> Future',
                                                'Future -> Present'],
                                    recipes: ['Ready', 'Not Ready',
                                              'Most Used', 'Least Used',
                                              'Recently Used', 'Not Used Since', 'Public'],
                                    pantry: ['Check Soon', 'Check Later',
                                             'Largest Amount', 'Smallest Amount',
                                             'Least Used', 'Most Used',
                                             'Recently Used', 'Not Used Since']}
        let orderTypes = []
        console.log(catagory)
        if (catagory != ''){
            orderTypes = new Array(...displayCatagories[catagory])}

        this.state = {dispCats: displayCatagories,
                        dispOrderType: orderTypes,
                        catagory: catagory,
                        orderBy: orderBy,
                        search: '',
                        optionList: [],
                        isLoading: false}
        this.handleChangeCatagory = this.handleChangeCatagory.bind(this)
        this.handleChangeOrderBy = this.handleChangeOrderBy.bind(this)}

    componentDidMount() {
       this.getData(this.state.catagory, this.state.orderBy, false)
    }

    changeOrderByValues(catagory) {
        const orderTypes = new Array(...this.state.dispCats[event.target.value])
        //since this seems to be an event based function its
        //timeline splits from my script, can't depend on these values being
        //set by the time I call getData.
        this.setState({catagory: event.target.value,
                        dispOrderType: orderTypes,
                        orderBy: ''})
    }

    handleChangeCatagory(event) {
        //console.log(event.target.value)
        if (event.target.value != 0) {
            this.props.history.push('/search/' + event.target.value + "/")
            this.changeOrderByValues(event.target.value)}}
        //this.getData(event.target.value, '', event)}}

    handleChangeOrderBy(event) {
        //since this seems to be an event based function its
        //timeline splits from my script, can't depend on these values being
        //set by the time I call getData.
        this.props.history.push('/search/' + this.state.catagory + "/" + event.target.value)
        this.setState({orderBy: event.target.value})
        //so i use a copy of those values here to update getData without race conditions.
        this.getData(this.state.catagory, event.target.value, event)}

    getData(catagory, orderBy, event) {
        if (event){
            event.preventDefault()}
        if (catagory == ''){
            return false}
        if (orderBy == '') {
            return false}
        this.setState({isLoading: true})
        const settings = {
            url: '/v1/views/search',
            data: JSON.stringify({catagory: catagory,
                                  orderBy: orderBy}),
            method: 'POST',
            callBack: (xhr) => this.handleApiResponse(xhr),
            history: this.props.history,
            headers: {"content-type": "application/json"}
        };
        this.setState({isLoading: true})
        let req = new Request(settings)
        req.withAuth()
        }


    handleApiResponse(xhr) {
        if (xhr.readyState == 4 && xhr.status == 200) {
            //if it works delete the credentials here before moving on.
            //console.log(xhr.responseText)
            const items = JSON.parse(xhr.responseText)
            //console.log(items)
            this.setState({optionList: items,
                           isLoading: false})}
        else if (xhr.readyState == 4 && xhr.status != 200){
            alert(xhr.responseText)
            this.setState({isLoading: false})}}

    renderCatagory() {
        let options = [(<option key={"bags"} defaultValue>Choose an option</option>)]
        for (const cat in this.state.dispCats) {
            options.push((<option key={cat} value={cat}>{cat}</option>))}
        return options}

    renderOrderBy() {
        //console.log(this.state.dispOrders)
        let orders = [(<option key={"button"} defaultValue>Choose an option</option>)]
        for (const orderType in this.state.dispOrderType) {
            orders.push((<option key={this.state.dispOrderType[orderType]}
                                value={this.state.dispOrderType[orderType]}>
                                {this.state.dispOrderType[orderType]}</option>))}
        return orders}

    filter(event){
        this.setState({search: event.target.value})}

    renderOptions(){
    }

  render () {
    return  (<>
    <Header history={this.props.history} inner="Search" />
    <div className="w3-margin w3-row-padding">
        <div className="w3-content">
            <form method="POST"
                  className={"w3-card " +
                             "w3-round " +
                             "w3-form " +
                             "w3-padding"}
                  onSubmit={(event) => event.preventDefault()} >
                <p>
                    <label htmlFor="catagory">Catagory</label>
                    <select id="catagory"
                            className="w3-select w3-round w3-padding-16"
                            value={this.state.catagory}
                            onChange={(event) => this.handleChangeCatagory(event)} >
                        {this.renderCatagory()}</select></p>
                <p>
                    <label htmlFor="order">Order By</label>
                    <select id="order"
                            className="w3-select w3-round w3-padding-16"
                            value={this.state.orderBy}
                            onChange={(event) => this.handleChangeOrderBy(event)} >
                        {this.renderOrderBy()}</select></p>
                <p>
                    <label htmlFor="searchBar">Filter</label>
                    <input  className="w3-select w3-round w3-padding-16"
                            id="searchBar"
                            type="search"
                            value={this.state.search}
                            onChange={(event) => this.filter(event)} /></p>
                <SearchResults items={this.state.optionList}
                               search={this.state.search}
                               isLoading={this.state.isLoading} /></form></div></div></>)}}
