import {styled} from '@/stitches.config';
import React, {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {ShadowTokenSingleValue} from 'Types/propertyTypes';
import IconMinus from '@/icons/minus.svg';
import IconPlus from '@/icons/plus.svg';
import IconGrabber from '@/icons/grabber.svg';
import IconCaretDown from '@/icons/caretdown.svg';
import {DndProvider, useDrop, useDrag, DropTargetMonitor} from 'react-dnd';
import {HTML5Backend, getEmptyImage} from 'react-dnd-html5-backend';

import {XYCoord} from 'dnd-core';
import {generateId} from '@/plugin/helpers';
import {debounce} from 'lodash';
import {Dispatch, RootState} from '../store';
import Heading from './Heading';
import IconButton from './IconButton';
import TokenInput from './TokenInput';

const Flex = styled('div', {
    display: 'flex',
});

interface DragItem {
    index: number;
    id: string;
    type: string;
}

enum ItemTypes {
    CARD = 'card',
}

const Select = styled('select', {
    all: 'unset',
    borderRadius: '$input',
    padding: '$4 $3',
    fontSize: 12,
    lineHeight: 1,
    color: '$text',
    border: '1px solid $border',
    '&:focus': {boxShadow: `$focus`},
});

function SingleShadowInput({
    isMultiple = false,
    shadowItem,
    index,
    onRemove,
    id,
}: {
    isMultiple?: boolean;
    shadowItem: ShadowTokenSingleValue;
    index: number;
    onRemove: (index: number) => void;
    id: string;
}) {
    const {editToken} = useSelector((state: RootState) => state.uiState);
    const dispatch = useDispatch<Dispatch>();

    const onChange = (e) => {
        if (Array.isArray(editToken.value)) {
            const values = editToken.value;
            const newShadow = {...editToken.value[index], [e.target.name]: e.target.value};
            values.splice(index, 1, newShadow);

            dispatch.uiState.setEditToken({...editToken, value: values});
        } else {
            dispatch.uiState.setEditToken({...editToken, value: {...editToken.value, [e.target.name]: e.target.value}});
        }
    };

    const onMoveDebounce = (dragIndex, hoverIndex) => {
        const values = editToken.value;
        const dragItem = values[dragIndex];
        values.splice(dragIndex, 1);
        values.splice(hoverIndex, 0, dragItem);
        dispatch.uiState.setEditToken({...editToken, value: values});
    };
    const onMove = useCallback(debounce(onMoveDebounce, 300), [editToken.value]);

    const ref = React.useRef<HTMLDivElement>(null);

    const [{handlerId}, drop] = useDrop({
        accept: ItemTypes.CARD,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item: DragItem, monitor: DropTargetMonitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) {
                return;
            }

            const hoverBoundingRect = ref.current?.getBoundingClientRect();

            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

            const clientOffset = monitor.getClientOffset();

            const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }

            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            onMove(dragIndex, hoverIndex);

            item.index = hoverIndex;
        },
    });

    const [{isDragging}, drag, preview] = useDrag({
        item: {
            type: ItemTypes.CARD,
            item: () => {
                return {id, index};
            },
            index,
        },
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(drop(ref));

    return (
        <Flex css={{flexDirection: 'column', gap: '$2', opacity: isDragging ? 0 : 1}}>
            <Flex css={{justifyContent: 'space-between', alignItems: 'center'}} ref={ref}>
                {isMultiple && (
                    <Flex css={{marginRight: '$3'}}>
                        <IconButton tooltip="Click to drag" icon={<IconGrabber />} data-handler-id={handlerId} />
                    </Flex>
                )}
                <Select css={{flexGrow: 1}} value={shadowItem.type} name="type" id="type" onChange={onChange}>
                    <option value="innerShadow">Inner Shadow</option>
                    <option value="dropShadow">Drop Shadow</option>
                </Select>
                {isMultiple && (
                    <IconButton tooltip="Remove this shadow" onClick={() => onRemove(index)} icon={<IconMinus />} />
                )}
            </Flex>
            <Flex css={{flexDirection: 'column', gap: '$2', paddingLeft: isMultiple ? '$8' : '0'}}>
                <TokenInput label="X" value={shadowItem.x} onChange={onChange} type="text" name="x" required />
                <TokenInput label="Y" value={shadowItem.y} onChange={onChange} type="text" name="y" required />
                <TokenInput label="Blur" value={shadowItem.blur} onChange={onChange} type="text" name="blur" required />
                <TokenInput
                    label="x"
                    value={shadowItem.spread}
                    onChange={onChange}
                    type="text"
                    name="spread"
                    required
                />
                <TokenInput
                    label="Color"
                    value={shadowItem.color}
                    onChange={onChange}
                    type="text"
                    name="color"
                    required
                />
            </Flex>
        </Flex>
    );
}

const newToken = {x: '0', y: '0', blur: '0', spread: '0', color: '#000', type: 'dropShadow'};

export default function BoxShadowInput() {
    const {editToken} = useSelector((state: RootState) => state.uiState);
    const dispatch = useDispatch<Dispatch>();
    const addShadow = () => {
        if (Array.isArray(editToken.value)) {
            dispatch.uiState.setEditToken({...editToken, value: [...editToken.value, newToken]});
        } else {
            dispatch.uiState.setEditToken({...editToken, value: [editToken.value, newToken]});
        }
    };
    const removeShadow = (index) => {
        dispatch.uiState.setEditToken({...editToken, value: editToken.value.filter((_, i) => i !== index)});
    };

    return (
        <div>
            <Flex css={{justifyContent: 'space-between', alignItems: 'center'}}>
                <Heading size="small">Shadow</Heading>
                <IconButton tooltip="Add another shadow" onClick={addShadow} icon={<IconPlus />} />
            </Flex>
            <Flex css={{flexDirection: 'column', gap: '$4'}}>
                <DndProvider backend={HTML5Backend}>
                    {Array.isArray(editToken.value) ? (
                        editToken.value.map((token, index) => {
                            const id = generateId(4);
                            return (
                                <SingleShadowInput
                                    isMultiple
                                    shadowItem={token}
                                    index={index}
                                    id={id}
                                    key={id}
                                    onRemove={removeShadow}
                                />
                            );
                        })
                    ) : (
                        <SingleShadowInput index={0} shadowItem={editToken.value} />
                    )}
                </DndProvider>
            </Flex>
        </div>
    );
}
