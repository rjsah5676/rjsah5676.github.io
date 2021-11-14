import React, { Component} from "react";
import FadeIn from "../effect/FadeIn";

class AlgoPage extends Component {
  state={
    username:""
  }
  componentDidMount() {
    fetch('http://localhost:5000/api')
        .then(res=>res.json())
        .then(data=>this.setState({username:data.username}));
  }
  render (){
    return (
      <FadeIn>
        <div>
          알고페이지
          {this.state.username}
        </div>
      </FadeIn>
    );
  }
}

export default AlgoPage;
