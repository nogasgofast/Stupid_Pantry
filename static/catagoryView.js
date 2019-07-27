let e = React.createElement;

class catagories extends React.Component {
  render() {
    return (
      e('ul', {className: "w3-ul"},
        e('li', null, e('button', {className: "w3-button w3-hover-yellow"}, 'Cookbook')),
        e('li', null, e('button', {className: "w3-button w3-hover-yellow"}, 'Pantry')),
        e('li', null, e('button', {className: "w3-button w3-hover-yellow"}, 'Shopping')),
        e('li', null, e('button', {className: "w3-button w3-hover-yellow"}, 'Browsing'))
      )
    )
  }
}
class navHeader extends React.Component {
  render() {
    return (
      e('div',
        {className: "w3-bar"},
        e('button',
          {className: "fas fa-backward w3-yellow w3-xxlarge w3-bar-item"},
          null
        ),
        e('button',
          {className: "w3-col fas fa-forward w3-yellow w3-xxlarge w3-bar-item w3-right"},
          null
        )
      )
    )
  }
}


export default class CatagoryView extends React.Component {
  render() {
    return (
      e('div', null,
        e(navHeader, null, null),
        e('div', { className: "w3-padding w3-row w3-container w3-center"},
          e('div', { className: "w3-center w3-twothird w3-card w3-container"},
            e('h1', null, 'Catagories'),
            e(catagories, null, null)
          )
        )
      )
    )
  }
}
