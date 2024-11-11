import { useState } from "react";
import {
  Card,
  CardHeader,
  Input,
  Typography,
  Button,
  CardBody,
  Chip,
  CardFooter,
  Tabs,
  TabsHeader,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
  Select,
  Option
} from "@material-tailwind/react";

import {
  ArrowLongDownIcon,
  ArrowLongUpIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline"

const TableHeader = ({ headers, onSortColumnChange, sortColumn, sortDirection }) => {
  const handleHeaderClick = (column) => {
    onSortColumnChange(column);
  };

  return (
    <thead>
      <tr>
        {headers.map((header) => (
          <th
            key={header.column}
            className="border-b border-gray-300 pb-4 pt-10"
            onClick={() => handleHeaderClick(header.column)}
          >
            <Typography
              variant="small"
              color="blue-gray"
              className="font-bold leading-none flex gap-x-1"
            >
              {
                sortColumn === header.column ?
                  (
                    <span className="">{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )
                  :
                  (
                    <span className="">&nbsp;</span>
                  )
              }
              {header.label}{" "}
            </Typography>
          </th>
        ))}
      </tr>
    </thead>
  );
};

const TableBody = ({
  headers,
  data,
  currentPage,
  itemsPerPage,
  sortColumn,
  sortDirection,
  isLoading,
}) => {
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;

  // Sort data based on the default sorting column and direction
  const sortedData = [...data].sort((a, b) => {
    const columnA = a[sortColumn];
    const columnB = b[sortColumn];

    if (columnA < columnB) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (columnA > columnB) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // const paginatedData = data.slice(startIdx, endIdx);
  const paginatedData = sortedData.slice(startIdx, endIdx);

  return (
    <>
      <tbody>

        {!isLoading &&
          paginatedData.map((item, index) => {
            const isLast = index === sortedData.length - 1
            const classes = isLast ? "py-4" : "py-4 border-b border-gray-300"
            return (
              < tr
                key={index}
                className="hover:bg-gray-50"
              >
                {
                  headers.map((header, i) => (
                    <td
                      key={i}
                      className={classes}
                    >
                      {

                        header.label == "Data" ?
                          (
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-bold"
                            >
                              {
                                `${item[header.column].split("-")[2]}/${item[header.column].split("-")[1]}/${item[header.column].split("-")[0]}`
                              }
                            </Typography>
                          )
                          :
                          (
                            <Typography
                              variant="small"
                              className="font-normal text-gray-600"
                            >
                              {item[header.column]}
                            </Typography>
                          )
                      }
                    </td>
                  ))
                }
              </tr>
            )
          })}
      </tbody >
    </>
  );
};

const Pagination = ({
  currentPage,
  totalNumberOfPages,
  handlePageChange,
  maxPageNumbers = 5, // Set the maximum number of page numbers to display
}) => {
  const pageNumbers = Array.from(
    { length: totalNumberOfPages },
    (_, index) => index + 1
  );

  const renderPageNumbers = () => {
    if (totalNumberOfPages <= maxPageNumbers) {
      return pageNumbers;
    }

    const middleIndex = Math.floor(maxPageNumbers / 2);

    if (currentPage <= middleIndex) {
      // Display pages from 1 to maxPageNumbers
      return [
        ...pageNumbers.slice(0, maxPageNumbers - 1),
        "...",
        totalNumberOfPages,
      ];
    } else if (currentPage >= totalNumberOfPages - middleIndex) {
      // Display pages from totalNumberOfPages - maxPageNumbers + 2 to totalNumberOfPages
      return [1, "...", ...pageNumbers.slice(-maxPageNumbers + 1)];
    } else {
      // Display pages around the current page
      const startPage = currentPage - middleIndex + 1;
      const endPage = currentPage + middleIndex - 1;
      return [
        1,
        "...",
        ...pageNumbers.slice(startPage, endPage),
        "...",
        totalNumberOfPages,
      ];
    }
  };

  return (
    <CardFooter className="md:flex items-center md:justify-between border-t border-blue-gray-50">
      <Typography variant="small" color="blue-gray" className="font-normal">
        Showing 1 to {totalNumberOfPages} of {totalNumberOfPages} entries
      </Typography>

      <div className="flex gap-1">
        <Button
          variant="outlined"
          size="sm"
          onClick={() => handlePageChange((currentPage - 1))}
          disabled={currentPage === 1}>
          Previous
        </Button>
        {renderPageNumbers().map((pageNumber, index) => (
          <div key={index} className="font-normal">
            <Button
              variant="outlined"
              size="sm"
              className={`page-link ${currentPage === pageNumber ? "bg-green-400" : ""}`}
              onClick={() => handlePageChange(pageNumber)}
            >
              {index + 1}
            </Button>
          </div>
        ))}
        <Button
          variant="outlined"
          size="sm"
          onClick={() => handlePageChange((currentPage + 1))}
          disabled={currentPage === totalNumberOfPages}>
          Next
        </Button>
      </div>
    </CardFooter>
  )
}



const TableDaysMonth = ({ headers, data = [], isLoading, loadingTag }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState(""); // Added state for search
  const [itemsPerPage, setItemsPerPage] = useState(10); // Added state for itemsPerPage
  const [sortColumn, setSortColumn] = useState(headers[0].column); // Default sorting column
  const [sortDirection, setSortDirection] = useState("asc"); // Default sorting direction

  // Garantir que data é um array antes de aplicar o filtro
  const filteredData = Array.isArray(data) && data.length > 0
    ? data.filter((item) =>
      headers.some((header) =>
        String(item[header.column])
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      )
    )
    : [];

  const totalNumberOfPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSortColumnChange = (column) => {
    if (sortColumn === column) {
      setSortDirection((prevDirection) =>
        prevDirection === "asc" ? "desc" : "asc"
      );
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    setCurrentPage(1);
  };

  return (
    <section className="w-full max-w-screen-xl rounded-xl bg-transparent">
      <Card className="h-full w-full border dark:border-gray-300 px-6 bg-transparent">
        <Typography className="my-3 w-80 font-normal text-gray-600 md:w-full">
          Métricas diárias.
        </Typography>
        <div className="md:flex md:justify-between w-full min-w-min">
          <div className="flex gap-x-2">
            <div>
              <Select
                variant="standard" // static || standard ||  outlined
                label="Dias por página"
                size="md"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e, 10));
                  setCurrentPage(1);
                }}
              >
                <Option value="7">7</Option>
                <Option value="14">14</Option>
                <Option value="31">31</Option>
              </Select>
            </div>
          </div>
          <div className="">
            <Input
              size="md"
              // className="input input-bordered input-sm w-full max-w-xs focus:outline-0 mb-2"
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Filtrar"
            />
          </div>
        </div>

        <div className="">
          <table className="w-full min-w-min table-auto text-center text-xs">
            <TableHeader
              headers={headers}
              onSortColumnChange={handleSortColumnChange}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
            />
            <TableBody
              headers={headers}
              data={filteredData}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              isLoading={isLoading}
              loadingTag={loadingTag}
            />
          </table>
        </div>
        {isLoading ? (
          <div style={{ textAlign: "center", width: "200px", margin: "0 auto" }}>
            <p>{loadingTag}</p>
          </div>
        ) : (
          ""
        )}

        <div className="w-full min-w-min">
          <Pagination
            currentPage={currentPage}
            totalNumberOfPages={totalNumberOfPages}
            handlePageChange={handlePageChange}
          />
        </div>
      </Card>
    </section>
  );
};

export { TableDaysMonth }
