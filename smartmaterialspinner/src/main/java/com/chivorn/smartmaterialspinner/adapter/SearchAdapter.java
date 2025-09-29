package com.chivorn.smartmaterialspinner.adapter;

import android.content.Context;
import android.widget.ArrayAdapter;
import android.widget.Filter;
import android.widget.Filterable;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.chivorn.smartmaterialspinner.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class SearchAdapter<T> extends ArrayAdapter<T> implements Filterable {
    private Context context;
    private final List<T> itemList;
    private volatile List<T> itemListFiltered;

    public SearchAdapter(@NonNull Context context, int resource, @NonNull List<T> objects) {
        super(context, resource, objects);
        this.context = context;
        this.itemList = objects;
        this.itemListFiltered = objects;
    }

    @Override
    public int getCount() {
        List<T> filtered = itemListFiltered;
        return filtered != null ? filtered.size() : 0;
    }

    @Nullable
    @Override
    public T getItem(int position) {
        List<T> filtered = itemListFiltered;
        if (filtered != null && position >= 0 && position < filtered.size()) {
            return filtered.get(position);
        }
        return null;
    }

    @NonNull
    @Override
    public Filter getFilter() {
        return new Filter() {
            @Override
            protected FilterResults performFiltering(CharSequence charSequence) {
                String charString = charSequence != null ? charSequence.toString() : null;
                if (charString == null || charString.isEmpty()) {
                    itemListFiltered = itemList;
                } else {
                    List<T> filteredList = new ArrayList<>();
                    String searchText = StringUtils.removeDiacriticalMarks(charString).toLowerCase(Locale.getDefault());
                    for (T row : itemList) {
                        String item = StringUtils.removeDiacriticalMarks(row.toString()).toLowerCase(Locale.getDefault());
                        if (item.contains(searchText)) {
                            filteredList.add(row);
                        }
                    }
                    itemListFiltered = filteredList;
                }

                FilterResults filterResults = new FilterResults();
                filterResults.values = itemListFiltered;
                filterResults.count = itemListFiltered.size();
                return filterResults;
            }

            @Override
            @SuppressWarnings({
                    "unchecked",
                    "rawtypes"
            })
            protected void publishResults(CharSequence constraint, FilterResults results) {
                if (results != null && results.values != null) {
                    itemListFiltered = (List<T>) results.values;
                } else {
                    itemListFiltered = new ArrayList<>();
                }
                notifyDataSetChanged();
            }
        };
    }
}