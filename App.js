/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import DragContainer from './DragContainer';
export default class App extends Component {
  
  constructor(props) {
    super(props);
    let list = [];
    for (let index = 0; index < 12; index++) {
      list.push({
        title: `cell${index + 1}`
      })
    }
    this.state = {
      list,
      isAtSpin: false,
      showControl: true
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <DragContainer
          contentStyle={{
            alignSelf: 'center',
            marginTop: 100,
            backgroundColor: '#f00',
            paddingVertical: 20,
          }}
          ref={component => this._sortSceneGrid = component}
          dataSource={this.state.list}
          columnWidth={60}
          rowHeight={60}
          sortable={!this.state.isAtSpin}
          renderCell={this.renderCell}
        />
      </View>
    );
  }

  renderCell = (data, component) => {
    let showControl = this.state.showControl;
    return (
      <View 
        style={{
          backgroundColor: '#58bbff',
          height: '100%',
        }}
      >
        <View>
          {
            showControl ? (
              <TouchableOpacity onPress={() => this.handleDelete(component)}>
                <Text>x</Text>
              </TouchableOpacity>
            ):null
          }
          <Text>{data.title}</Text>
        </View>
      </View>
    )
  }

  handleDelete = (component) => {
    let cellIndex = this._sortSceneGrid._cells.findIndex((cell) => {
        return cell.component === component
    })
    this._sortSceneGrid.removeCell({
        cellIndex,
        callback: (newList) => {
            console.log(newList)
        }
    })
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
