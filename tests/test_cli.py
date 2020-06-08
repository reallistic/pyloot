import sys
from unittest import mock

from pyloot import cli


@mock.patch("pyloot.cli.PyLootServer.serve_forever")
def test_base_cli(mocked_serve):
    with mock.patch.object(sys, "argv", ["pyloot"]):
        cli.main()
    mocked_serve.assert_called_once_with(host="0.0.0.0", port=8000)


@mock.patch("pyloot.cli.PyLootServer.serve_forever")
def test_cli_override_port(mocked_serve):
    with mock.patch.object(sys, "argv", ["pyloot", "-p", "8081"]):
        cli.main()
    mocked_serve.assert_called_once_with(host="0.0.0.0", port=8081)


@mock.patch("pyloot.cli.PyLootServer.serve_forever")
def test_cli_override_port_host(mocked_serve):
    with mock.patch.object(sys, "argv", ["pyloot", "-p", "8081", "-h", "127.0.0.1"]):
        cli.main()
    mocked_serve.assert_called_once_with(host="127.0.0.1", port=8081)
