import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import Typography from '@mui/material/Typography'

// todo(FL): try using MetaTable for this
const KeyTable = ({ row }) => {
  return (
    <>
      <Typography variant="h6" gutterBottom component="div">
        Lorawan Keys
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Key</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(row).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export default KeyTable