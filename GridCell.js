import React, { Component } from 'react';
import { View, Animated } from 'react-native';
import { cellAnimationTypes, cellTranslation, cellScale, spinValues } from './constants';
export default class GridCell extends Component {

  static defaultProps = {
    coordinate: {
      x: 0,
      y: 0
    },
    columnWidth: 120,
    clumnHeight: 120,
    data: {name: 'test'},
    index: 0,
  }

  constructor(props) {
    super(props);
    let {x, y} = props.coordinate;
    this.state = {
      coordinate: new Animated.ValueXY({
        x,
        y
      }),
      // spinValue: new Animated.Value(spinValues.middle),
      scale: new Animated.Value(1),
      zIndex: 0,
      visible: true
    };
    this._scaleAnimationInstance = null;
    this._translationAnimationInstance = null;
  }

  render() {
    let {columnWidth, clumnHeight, data, index,} = this.props;
    let {x, y,} = this.state.coordinate;
    // const spinValue = this.state.spinValue.interpolate({
    //   inputRange: [spinValues.min, spinValues.max],
    //   outputRange: ['-3deg', '3deg']
    // })
    return (
      this.state.visible ?
        <Animated.View
          key={`sortable-cell-${(data.key != null) ? data.key : index}`}
          style={{
            width: columnWidth, 
            height: clumnHeight, 
            position: 'absolute', 
            borderWidth: 1,
            borderColor: '#789911',
            zIndex: this.state.zIndex, 
            left: x, top: y, 
            transform: [ 
              { scale: this.state.scale}, 
              // {rotate: spinValue} 
            ], 
          }}
        >
          {this.props.renderCell(data, this)}
        </Animated.View> : null
    );
  }

  componentWillUnmount() {
    this._stopScaleAnmation()
  }

  setCoordinate = (coordinate) => {
    let {x, y,} = coordinate
    this.setState({
      coordinate: new Animated.ValueXY({
        x,
        y,
      })
    })
  }

  setZIndex = (zIndex) => {
    this.setState({
      zIndex,
    })
  }

  startScaleAnimation = ({ scaleValue, callback, }) => {
    this._scaleAnimationInstace = Animated.timing(
        this.state.scale,
        {
            toValue: scaleValue,
            duration: cellScale.animationDuration,
        }
    ).start(() => {
      this._scaleAnimationInstace = null
      if(scaleValue == 0) {
        this.setState({
          visible: false,
        })
      }
      callback && callback()
    })
  }

  // startSpinAnimation = () => {
  //   let getTargetValue = (value) => {
  //     return value === spinValues.min ? spinValues.max : spinValues.min
  //   }
  //   this._spinAnimationInstance = Animated.timing(
  //     this.state.spinValue,
  //     {
  //       toValue: getTargetValue(this.state.spinValue._value),
  //       duration: 100
  //     }
  //   )
  //   this._spinAnimationInstance.start((o) => {
  //     if(o.finished) {
  //       this.startSpinAnimation()
  //     }
  //   })
  // }

  // stopSpinAnmation = () => {
  //   this._spinAnimationInstance.stop()
  //   this._spinAnimationInstance = null
  // }

  getTranslationAnimation = ({ animationType, coordinate, }) => {
    let { columnWidth} = this.props
    let { backToOrigin, rightTranslation, leftTranslation,} = cellAnimationTypes
    let x = this.state.coordinate.x._value
    let y = this.state.coordinate.y._value
    let { x: originX, y: originY, } = coordinate
    switch (animationType) {
      case backToOrigin:
          x = originX
          y = originY
          break;
      case leftTranslation:
          x = x - (columnWidth - (originX - x))
          break;
      case rightTranslation:
          x = x + (columnWidth - (x - originX))
          break;
    }
    return Animated.timing(
      this.state.coordinate,
      {
        toValue: {
          x,
          y,
        },
        duration: cellTranslation.animationDuration,
      }
    )
  }

  startTranslationAnimation = ({ animationType, coordinate, callback, }) => {
    this.stopTranslationAnimation()
    this._translationAnimationInstace = this.getTranslationAnimation({ animationType, coordinate,})
    this._translationAnimationInstace.start((o) => {
      if(o.finished) {
        callback && callback()
        this._translationAnimationInstace = null
      }
    })
  }

  stopTranslationAnimation = () => {
    this._translationAnimationInstace && this._translationAnimationInstace.stop()
    this._translationAnimationInstace = null
  }

  _stopScaleAnmation = () => {
    this._scaleAnimationInstace && this._scaleAnimationInstace.stop()
    this._scaleAnimationInstace = null
  }

}
