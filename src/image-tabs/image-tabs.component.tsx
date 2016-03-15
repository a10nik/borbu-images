import * as React from 'react';
import * as classNames from 'classnames';
import {Image as CanvasImage, Surface as CanvasSurface, Text as CanvasText} from 'react-canvas';
import Dropzone = require('react-dropzone');
import lodash = require("lodash");
import {Paper, FlatButton, Toolbar, DropDownMenu, ToolbarGroup, MenuItem} from "material-ui";
import ImageEditor from "../image-editor/image-editor.component";
import ErrorSnackbar from "../common/error-snackbar.component";
import {IError, ImageLoadError} from "../common/errors";
var styles = require("./image-tabs.component.css");

interface ImageTabsProps {
}

interface ImageTabsState {
    splitVertically: boolean,
    tabs: TabState[],
    error?: IError
}

interface TabState {
    img: HTMLImageElement
}

export default class ImageTabs extends React.Component<ImageTabsProps, ImageTabsState> {

    constructor(props) {
        super(props);

        this.state = {
            tabs: [null, null],
            splitVertically: true,
            error: null
        };
    }

    private getPanelStyle(i: number) {
        return {
            display: "inline-block",
            marginTop: 20,
            width: this.state.splitVertically ? "48%" : "100%",
            marginRight: this.state.splitVertically && i === 0 ? "4%" : 0,
            verticalAlign: "top"
        };
    }

    setImg(tabId: number, img: HTMLImageElement) {
        var newTabs = this.state.tabs.concat([]);
        newTabs[tabId] = { img: img };
        this.setState(lodash.merge(this.state, {tabs: newTabs}) as ImageTabsState)
    }

    onImgLoadError() {
        this.setState(lodash.merge(this.state, {error: new ImageLoadError()}) as ImageTabsState)
    }

    clearError() {
        this.setState(lodash.merge(this.state, {error: null}) as ImageTabsState)
    }

    setSplitVertically(val:boolean) {
        this.setState(lodash.merge(this.state, {splitVertically: val}) as ImageTabsState)
    }

    render() {
        return(
            <div>
                <Toolbar>
                    <ToolbarGroup firstChild={true} float="left">
                        <DropDownMenu value={this.state.splitVertically} onChange={(e, i, val) => this.setSplitVertically(val)}>
                            <MenuItem value={true} primaryText="Split vertically" />
                            <MenuItem value={false} primaryText="Split horizontally" />
                        </DropDownMenu>
                    </ToolbarGroup>
                </Toolbar>
                <Paper style={this.getPanelStyle(0)}>
                    <ImageEditor img={this.state.tabs[0] ? this.state.tabs[0].img : null}
                                 onImgLoad={img => this.setImg(0, img)}
                                 onImgLoadError={() => this.onImgLoadError()}/>
                </Paper>
                <Paper style={this.getPanelStyle(1)}>
                    <ImageEditor img={this.state.tabs[1] ? this.state.tabs[1].img : null}
                                 onImgLoad={img => this.setImg(1, img)}
                                 onImgLoadError={() => this.onImgLoadError()}/>
                </Paper>
                <ErrorSnackbar error={this.state.error} clearError={() => this.clearError()}/>
            </div>
        );
    }

}
