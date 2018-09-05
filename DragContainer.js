import React, { Component } from 'react';
import { 
  View,
  PanResponder,
  ScrollView,
  Animated
} from 'react-native';
import GridCell from './GridCell';
import {
  containerLayout,
  cellChangeTypes,
  cellAnimationTypes,
  cellScale
} from './constants';
import TimerEnhance from 'react-native-smart-timer-enhance'
import Utils from './Utils';
class SortContainer extends Component {
  static defaultProps = {
    dataSource: [{
      title: 'cell1'
    }, {
      title: 'cell2'
    }],
    columnWidth: 120,
    rowHeight: 120,
    sortable: true
  }
  constructor(props) {
    super(props);
    let { dataSource, columnWidth, rowHeight, sortable, } = props
    this.state = {
      dataSource,
      sortable,
      scrollEnabled: true,
      containerHeight: rowHeight,
      containerWidth: dataSource.length * columnWidth
    }
    this._rowHeight = rowHeight;
    this._offsetX = 0;
    this._columnWidth = columnWidth;
    this._pageLeft = 0 //容器距离左边界距离
    this._pageTop = 0 //容器距离顶部边界距离
    this._width = 0 //容器宽度
    this._height = 0 //高度
    this._cells = []

    this._touchDown = null;
  }

  componentWillMount () {

    //注册用户触摸事件
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (e, gestureState) => {
        return this.state.sortable
      },
      onMoveShouldSetPanResponder: (e, {dx, dy}) => {
        return this.state.sortable && dx !== 0 && dy !== 0
      },
      onPanResponderGrant: this._onTouchStart,
      onPanResponderMove: this._onTouchMove,
      onPanResponderRelease: this._onTouchEnd,
      onPanResponderTerminationRequest: () => false,
    })
  }

  render() {
    return (
      <ScrollView 
          scrollEnabled={this.state.scrollEnabled}
          onScroll={this._scrollEnd}
          scrollEventThrottle={1}
          horizontal
          contentContainerStyle={[
            this.props.contentStyle,
            {
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }
          ]}
        >
          <View
              {...this._panResponder.panHandlers}
              onLayout={this._onLayout}
              style={{width: this.state.containerWidth, height: this.state.containerHeight,}}
              ref={component => this._container = component}
            >
          {this.renderCells()}
        </View>
      </ScrollView>
    );
  }

  _scrollEnd = (e) => {
    let offsetX = e.nativeEvent.contentOffset.x
    this._offsetX = offsetX
  }

  _enableScroll = () => {
    this.setState({scrollEnabled: true})
  }

  _disableScroll = () => {
    this.setState({scrollEnabled: false})
  }

  renderCells() {
    const dataSource = this.state.dataSource;
    return dataSource.map((data, index) => {
      let coordinate = {
        x: index * this._columnWidth,
        y: 0
      }
      return (
        <GridCell 
          ref={(component) => {
            if(component !== null) {
              this._cells[index] = {
                key: data.title,
                index,
                coordinate,
                component
              }
            }
          }}
          key={data.title}
          renderCell={this.props.renderCell}
          columnWidth={this._columnWidth}
          clumnHeight={this._rowHeight}
          coordinate={coordinate}
          data={data}
          index={index}
          sortable={this.state.sortable}
        />
      )
    })
  }

  _onLayout = (e) => {
    let {delay} = containerLayout
    this.setTimeout(() => {
      this._container.measure((ox, oy, width, height, px, py) => {
        this._width = width;
        this._height = height;
        this._pageLeft = px;
        this._pageTop = py;
      });
    }, delay);
  }

  _onTouchStart = (e, gestureState) => {
    if (!this.state.sortable || this._touchDown) {
      return
    }
    let { pageX, pageY, } = e.nativeEvent
    if (!this._currentStartCell) {
        this._touchDown = true
        this._disableScroll()
        let draggingCell = this._getTouchCell({
            x: pageX - this._pageLeft + this._offsetX,
            y: pageY - this._pageTop,
        })
        if (draggingCell == null) {
            return
        }
        this._currentStartCell = draggingCell
        this._currentDraggingComponent = this._currentStartCell.component
        draggingCell.component.setCoordinate({
            x: pageX - this._pageLeft - this._columnWidth / 2 + this._offsetX,
            y: pageY - this._pageTop - this._rowHeight / 2,
        })
        draggingCell.component.setZIndex(999)
        draggingCell.component.startScaleAnimation({
            scaleValue: cellScale.value,
        })
    }
  }

  _onTouchMove = (e, gestureState) => {
    if (!this._touchDown || !this.state.sortable || !this._currentStartCell || !this._currentDraggingComponent) {
        return
    }
    let { pageX, pageY, } = e.nativeEvent
    this._currentDraggingComponent.setCoordinate({
        x: pageX - this._pageLeft - this._columnWidth / 2 + this._offsetX,
        y: pageY - this._pageTop - this._rowHeight / 2,
    })
    let fixed_x = Math.min(this._width - 5, Math.max(5, pageX - this._pageLeft));
    let fixed_y = Math.min(this._height - 5, Math.max(5, pageY - this._pageTop));
    let hoverCell = this._getTouchCell({
        x: fixed_x + this._offsetX,
        y: fixed_y,
    })
    if (hoverCell == null || hoverCell.key == this._currentStartCell.key) {
        return
    }

    let currentCellIndex = this._currentStartCell.index
    let hoverCellIndex = hoverCell.index
    console.log('交换', currentCellIndex, '与', hoverCellIndex, '的component')
    let cellsAnimationOptions = Utils.getCellsAnimationOptions({
      currentCellIndex,
      hoverCellIndex,
      cells: this._cells,
    })
    this._sortCells({
      cellsAnimationOptions,
    })
    this._cells[hoverCellIndex].component = this._currentDraggingComponent
    this._currentStartCell = hoverCell
    this._currentDraggingComponent = hoverCell.component
  }

  _onTouchEnd = () => {
    this._touchDown = false
    this.clearTimeout(this._responderTimer)
    this._responderTimer = null
    if (this._touchEnding || !this.state.sortable || !this._currentStartCell || !this._currentDraggingComponent) {
        return
    }
    this._touchEnding = true
    let animationType = cellAnimationTypes.backToOrigin
    let cellIndex = this._currentStartCell.index
    let cell = this._cells[ cellIndex ]
    let coordinate = cell.coordinate
    this._currentDraggingComponent.startScaleAnimation({
        scaleValue: 1,
    })
    this._currentDraggingComponent.startTranslationAnimation({
        animationType,
        coordinate,
        callback: () => {
            if (!this._currentDraggingComponent) {
                return
            }
            this._currentDraggingComponent.setZIndex(0)
            this._sortDataSource()
            this._currentStartCell = null
            this._currentDraggingComponent = null
            this._touchEnding = false
        },
    })
  }

  _sortCells = ({ cellsAnimationOptions, callback, }) => {
      let { rightTranslation, } = cellAnimationTypes
      let animationParallels = callback && []
      for (let cellAnimationOption of cellsAnimationOptions) {

          let { cellComponent, cellIndex, animationType, } = cellAnimationOption
          let changedIndex = ( animationType == rightTranslation) ? 1 : -1

          this._cells[ cellIndex + changedIndex ].component = cellComponent
          let cell = this._cells[ cellIndex ]
          let coordinate = cell.coordinate
          if (!callback) {
              cellComponent.startTranslationAnimation({
                  animationType,
                  coordinate,
              })
          }
          else {
              let animation = cellComponent.getTranslationAnimation({
                  animationType,
                  coordinate,
              })
              animationParallels.push(animation)
          }
      }

      callback && Animated.parallel(animationParallels).start((o) => {
          if(o.finished) {
            callback && callback()
          }
      })
  }

  _sortDataSource = () => {
      let dataSource = []
      for (let cell of this._cells) {
          let orginalIndex = cell.component.props.index
          dataSource.push(this.state.dataSource[ orginalIndex ])
      }
      this.setState({
          dataSource,
      })
      this._enableScroll()
  }

  removeCell({cellIndex, callback}) {
    if(this._touchEnding || this.isRemoving) {
      return
    }
    this.isRemoving = true
    let currentCellIndex = cellIndex;
    let hoverCellIndex = this._cells.length - 1
    let component = this._cells[cellIndex].component
    let animationCallBack = () => {
      let dataSource = this._removeData(cellIndex)
      console.log(dataSource)
      this._cells = []
      this.setState({dataSource})
      this.isRemoving = false
      callback && callback(dataSource)
    }
    if(currentCellIndex < this._cells.length - 1) {
      component.startScaleAnimation({
          scaleValue: 0,
      })
      let cellsAnimationOptions = Utils.getCellsAnimationOptions({
          currentCellIndex,
          hoverCellIndex,
          cells: this._cells,
      })
      this._sortCells({
          cellsAnimationOptions,
          callback: animationCallBack,
      })
    } else {
      component.startScaleAnimation({
          scaleValue: 0,
          callback: animationCallBack,
      })
    }
  }

  _removeData(cellIndex) {
    let dataSource = [...this.state.dataSource]
    dataSource.splice(cellIndex, 1)
    return dataSource
  }

  _getTouchCell(touchCoordinate) {
    let columnWidth = this._columnWidth;
    console.log(this._cells)
    for (const cell of this._cells) {
      if(Utils.isPointInPath({
        touchCoordinate,
        cellCoordinate: cell.coordinate,
        cellWidth: columnWidth,
        cellHeight: columnWidth
      })) {
        return cell
      }
    }
    return null
  }
}

export default TimerEnhance(SortContainer)