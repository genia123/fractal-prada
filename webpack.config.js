const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  devtool: "cheap-module-eval-source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    symlinks: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
        options: {
          errorsAsWarnings: true
        }
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
              localIdentName: "[path][name]__[local]"
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: "file-loader"
          }
        ]
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    historyApiFallback: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html"
    })
  ]
};
