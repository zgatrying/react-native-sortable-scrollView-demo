import {
  dragDirection,
  cellAnimationTypes,
} from './constants'

function isPointInPath ({ touchCoordinate, cellCoordinate, cellWidth, cellHeight, }) {
  let { x, y, } = cellCoordinate
  let { x: coordinateX, y: coordinateY } = touchCoordinate
  if (!(coordinateX < x || coordinateX > x + cellWidth)
      && !(coordinateY < y || coordinateY > y + cellHeight)) {
      return true
  }
  return false
}

function getCellsAnimationOptions ({ currentCellIndex, hoverCellIndex, cells }) {
  let cellsAnimation = []
  let { right, left, } = dragDirection
  let { rightTranslation, leftTranslation,} = cellAnimationTypes
  let currentDirection = getDragDirection({
      currentCellIndex,
      hoverCellIndex,
  })
  let len = Math.abs(currentCellIndex - hoverCellIndex)
  for (let i = 0; i < len; i++) {
      let cellIndex, animationType
      switch (currentDirection) {
          case right: //currentCellIndex > hoverCellIndex
              cellIndex = hoverCellIndex - i
              animationType = leftTranslation
              break
          case left:  //currentCellIndex < hoverCellIndex
              cellIndex = hoverCellIndex
              animationType = rightTranslation
              break
      }
      let cellComponent = cells[ cellIndex ].component
      if(cellComponent) {
          cellsAnimation.push({
              cellIndex,
              cellComponent,
              animationType,
          })
      }
  }
  return cellsAnimation
}

function getDragDirection ({ currentCellIndex, hoverCellIndex, }) {
  let { right, left, none } = dragDirection
  if (currentCellIndex > hoverCellIndex) {
      return left
  }
  else if (currentCellIndex < hoverCellIndex) {
      return right
  }
  else {
      return none
  }
}

export default {
  isPointInPath,
  getDragDirection,
  getCellsAnimationOptions
}