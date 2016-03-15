import * as React from 'react';
import {Snackbar} from "material-ui";
import {IError} from "./errors";


export default class ErrorSnackbar extends React.Component<{error?: IError, clearError: () => void}, {}> {
    render() {
        return (
            <Snackbar
                open={!!this.props.error}
                message={this.props.error ? this.props.error.getText() : ""}
                autoHideDuration={10000}
                onRequestClose={() => this.props.clearError()}
            />
        );
    }

}
