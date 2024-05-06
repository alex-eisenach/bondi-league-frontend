//import logo from './logo.svg';
import './App.css';
import { Component, useState, useRef, useEffect } from 'react';
import ScorePlot from './plot';
import { TrackerPlot } from './plotd3';

class App extends Component{

    constructor(props) {
        super(props);
        this.state = {
            data    : [],
            golfers : []
        }
    }

    API_URL = "http://localhost:5038";

    componentDidMount() {
        this.refreshData();
    }



    async refreshData(){
        fetch(this.API_URL+"/test").then(response=>response.json())
            .then(data=>{
                this.setState({
                    data:    data,
                    golfers: data.map(datum => datum.Names)
                })
            })
    }

    render(){
        const{data, golfers} = this.state;
        return (
            <div className="App">
                <header>
                    <ScorePlot />
                    <TrackerPlot data={[1,2,3,4,5]}/>
                </header>
                <h2>Bondi League Scoretracker</h2>
                <p>
                    <b>* {golfers}</b>
                </p>
            </div>
        );
    }
}

export default App;
